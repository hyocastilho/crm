import json
from datetime import timedelta
from functools import wraps

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import rotate_token
from django.views.decorators.csrf import csrf_exempt
from django.db.models import OuterRef, Subquery
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .models import Contact, Conversation, LoginAttempt, Message, User

MAX_ATTEMPTS = 5
WINDOW = timedelta(minutes=15)
STAGE_ORDER = [choice for choice, _ in Conversation.Stage.choices]
STAGES = set(STAGE_ORDER)
STATUSES = {choice for choice, _ in Conversation.Status.choices}
HANDLERS = {choice for choice, _ in Conversation.Handler.choices}
CHANNELS = {choice for choice, _ in Conversation.Channel.choices}
SOURCES = {choice for choice, _ in Contact.Source.choices}


def fail(status, message):
    return JsonResponse({"error": message}, status=status)


def read_json(request):
    try:
        body = json.loads(request.body.decode() or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    return body if isinstance(body, dict) else None


def session_required(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated or user.business_id is None:
            return fail(401, "Sessão inválida")
        return view(request, *args, **kwargs)

    return wrapper


def too_many_attempts(email):
    since = timezone.now() - WINDOW
    return LoginAttempt.objects.filter(email=email, created_at__gte=since).count() >= MAX_ATTEMPTS


def contact_payload(contact):
    return {
        "id": str(contact.id),
        "name": contact.name,
        "phone": contact.phone or None,
        "instagram_username": contact.instagram_username or None,
        "source": contact.source,
        "created_at": contact.created_at.isoformat(),
    }


def conversation_for(user, conversation_id):
    return (
        Conversation.objects.select_related("contact")
        .filter(business_id=user.business_id, id=conversation_id)
        .first()
    )


@require_GET
@ensure_csrf_cookie
def health(request):
    return JsonResponse({"status": "ok"})


@require_http_methods(["POST"])
def login_view(request):
    body = read_json(request)
    if body is None:
        return fail(400, "Requisição inválida")
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    if not email or "@" not in email or len(email) > 200 or len(password) < 10 or len(password) > 200:
        return fail(401, "E-mail ou senha inválidos")
    if too_many_attempts(email):
        return fail(429, "Muitas tentativas. Tente de novo em 15 minutos.")
    user = authenticate(request, email=email, password=password)
    if user is None or not user.is_active or user.business_id is None:
        LoginAttempt.objects.create(email=email)
        return fail(401, "E-mail ou senha inválidos")
    LoginAttempt.objects.filter(email=email).delete()
    login(request, user)
    rotate_token(request)
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@require_GET
@ensure_csrf_cookie
@session_required
def me(request):
    user = request.user
    return JsonResponse(
        {
            "user": {
                "role": user.role,
                "businessName": user.business.name,
            }
        }
    )


@require_GET
@session_required
def conversations(request):
    channel = request.GET.get("channel") or None
    stage = request.GET.get("stage") or None
    query = (request.GET.get("q") or "").strip()
    if channel and channel not in CHANNELS:
        return fail(400, "Filtro inválido")
    if stage and stage not in STAGES:
        return fail(400, "Filtro inválido")
    if len(query) > 80:
        return fail(400, "Filtro inválido")

    latest = Message.objects.filter(conversation=OuterRef("pk")).order_by("-created_at")
    rows = Conversation.objects.select_related("contact").filter(business_id=request.user.business_id)
    if channel:
        rows = rows.filter(channel=channel)
    if stage:
        rows = rows.filter(stage=stage)
    if query:
        rows = rows.filter(contact__name__icontains=query)
    rows = rows.annotate(preview=Subquery(latest.values("body")[:1])).order_by("-last_message_at")[:100]

    return JsonResponse(
        {
            "conversations": [
                {
                    "id": str(row.id),
                    "channel": row.channel,
                    "stage": row.stage,
                    "status": row.status,
                    "handler": row.handler,
                    "lastMessageAt": row.last_message_at.isoformat(),
                    "preview": row.preview or "",
                    "contact": {
                        "id": str(row.contact_id),
                        "name": row.contact.name,
                        "phone": row.contact.phone or None,
                        "instagram_username": row.contact.instagram_username or None,
                    },
                }
                for row in rows
            ]
        }
    )


@require_http_methods(["GET", "PATCH"])
@session_required
def conversation_detail(request, conversation_id):
    conversation = conversation_for(request.user, conversation_id)
    if conversation is None:
        return fail(404, "Conversa não encontrada")

    if request.method == "GET":
        messages = conversation.messages.order_by("created_at")[:300]
        return JsonResponse(
            {
                "conversation": {
                    "id": str(conversation.id),
                    "channel": conversation.channel,
                    "stage": conversation.stage,
                    "status": conversation.status,
                    "handler": conversation.handler,
                    "assigneeId": str(conversation.assignee_id) if conversation.assignee_id else None,
                    "lastMessageAt": conversation.last_message_at.isoformat(),
                },
                "contact": contact_payload(conversation.contact),
                "messages": [
                    {
                        "id": str(item.id),
                        "direction": item.direction,
                        "author": item.author,
                        "body": item.body,
                        "created_at": item.created_at.isoformat(),
                    }
                    for item in messages
                ],
            }
        )

    body = read_json(request)
    if body is None or not body:
        return fail(400, "Dados inválidos")
    updates = {}
    if "stage" in body:
        if body["stage"] not in STAGES:
            return fail(400, "Dados inválidos")
        updates["stage"] = body["stage"]
    if "status" in body:
        if body["status"] not in STATUSES:
            return fail(400, "Dados inválidos")
        updates["status"] = body["status"]
    if "handler" in body:
        if body["handler"] not in HANDLERS:
            return fail(400, "Dados inválidos")
        updates["handler"] = body["handler"]
    if "assignee_id" in body:
        assignee = body["assignee_id"]
        if assignee is None:
            updates["assignee"] = None
        else:
            try:
                assignee_id = int(assignee)
            except (TypeError, ValueError):
                return fail(400, "Dados inválidos")
            if not User.objects.filter(id=assignee_id, business_id=request.user.business_id).exists():
                return fail(400, "Dados inválidos")
            updates["assignee_id"] = assignee_id
    if not updates:
        return fail(400, "Dados inválidos")
    for field, value in updates.items():
        setattr(conversation, field, value)
    conversation.save(update_fields=[*updates.keys(), "updated_at"])
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
@session_required
def conversation_message(request, conversation_id):
    conversation = conversation_for(request.user, conversation_id)
    if conversation is None:
        return fail(404, "Conversa não encontrada")
    body = read_json(request)
    text = ""
    if body is not None:
        text = str(body.get("body", "")).strip()
    if not text or len(text) > 4000:
        return fail(400, "Mensagem inválida")
    message = Message.objects.create(
        business_id=request.user.business_id,
        conversation=conversation,
        direction=Message.Direction.OUT,
        author=Message.Author.HUMAN,
        body=text,
    )
    conversation.handler = Conversation.Handler.HUMANO
    conversation.last_message_at = message.created_at
    conversation.save(update_fields=["handler", "last_message_at", "updated_at"])
    return JsonResponse(
        {
            "message": {
                "id": str(message.id),
                "direction": message.direction,
                "author": message.author,
                "body": message.body,
                "created_at": message.created_at.isoformat(),
            }
        },
        status=201,
    )


@require_http_methods(["GET", "POST"])
@session_required
def contacts(request):
    if request.method == "GET":
        rows = Contact.objects.filter(business_id=request.user.business_id).order_by("name")[:500]
        return JsonResponse({"contacts": [contact_payload(row) for row in rows]})

    body = read_json(request)
    if body is None:
        return fail(400, "Requisição inválida")
    name = str(body.get("name", "")).strip()
    phone = str(body.get("phone") or "").strip()
    instagram = str(body.get("instagram_username") or "").strip()
    source = body.get("source") or Contact.Source.MANUAL
    if len(name) < 2 or len(name) > 120 or len(phone) > 30 or len(instagram) > 60 or source not in SOURCES:
        return fail(400, "Dados inválidos")
    contact = Contact.objects.create(
        business_id=request.user.business_id,
        name=name,
        phone=phone,
        instagram_username=instagram,
        source=source,
    )
    return JsonResponse({"contact": contact_payload(contact)}, status=201)


@require_http_methods(["PATCH"])
@session_required
def contact_detail(request, contact_id):
    contact = Contact.objects.filter(business_id=request.user.business_id, id=contact_id).first()
    if contact is None:
        return fail(404, "Contato não encontrado")
    body = read_json(request)
    if body is None or not body:
        return fail(400, "Dados inválidos")
    if "name" in body:
        name = str(body["name"]).strip()
        if len(name) < 2 or len(name) > 120:
            return fail(400, "Dados inválidos")
        contact.name = name
    if "phone" in body:
        phone = str(body["phone"] or "").strip()
        if len(phone) > 30:
            return fail(400, "Dados inválidos")
        contact.phone = phone
    if "instagram_username" in body:
        instagram = str(body["instagram_username"] or "").strip()
        if len(instagram) > 60:
            return fail(400, "Dados inválidos")
        contact.instagram_username = instagram
    contact.save()
    return JsonResponse({"contact": contact_payload(contact)})


@require_GET
@session_required
def pipeline(request):
    rows = (
        Conversation.objects.select_related("contact")
        .filter(business_id=request.user.business_id)
        .order_by("-last_message_at")[:300]
    )
    counts = {stage: 0 for stage in STAGE_ORDER}
    by_stage = {stage: [] for stage in STAGE_ORDER}
    for row in rows:
        counts[row.stage] += 1
        by_stage[row.stage].append(
            {"id": str(row.id), "name": row.contact.name, "channel": row.channel}
        )
    return JsonResponse({"counts": counts, "byStage": by_stage})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def meta_webhook(request):
    return fail(401, "Não autorizado")
