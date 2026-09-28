import os
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from crm.models import Business, Contact, Conversation, Message, User


DEMO = [
    {
        "name": "Ana Beatriz Souza",
        "phone": "+55 92 98111-0101",
        "instagram": "",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "novo",
        "status": "aberta",
        "minutes": 10,
        "messages": [
            ("in", "customer", "Oi! Vocês têm a bolsa azul em estoque?", 12),
            ("out", "human", "Oi, Ana! Temos sim, chegou ontem.", 10),
        ],
    },
    {
        "name": "Carlos Menezes",
        "phone": "+55 92 98111-0202",
        "instagram": "",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "em_atendimento",
        "status": "aberta",
        "minutes": 40,
        "messages": [
            ("in", "customer", "Bom dia, qual o prazo de entrega para Manaus?", 50),
            ("out", "human", "Bom dia! De 2 a 3 dias úteis.", 40),
        ],
    },
    {
        "name": "Daniela Rocha",
        "phone": "",
        "instagram": "dani.rocha",
        "source": "instagram",
        "channel": "instagram",
        "stage": "orcamento",
        "status": "aguardando",
        "minutes": 120,
        "messages": [
            ("in", "customer", "Consegue me mandar o orçamento de 3 peças?", 180),
            ("out", "human", "Claro, envio ainda hoje o valor fechado.", 120),
        ],
    },
    {
        "name": "Eduardo Lima",
        "phone": "+55 92 98111-0404",
        "instagram": "",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "pedido",
        "status": "aberta",
        "minutes": 300,
        "messages": [("in", "customer", "Fechado, pode separar o pedido.", 300)],
    },
    {
        "name": "Fernanda Prado",
        "phone": "",
        "instagram": "fefe.prado",
        "source": "instagram",
        "channel": "instagram",
        "stage": "pago",
        "status": "encerrada",
        "minutes": 60 * 24,
        "messages": [("out", "human", "Pagamento confirmado, obrigado!", 60 * 24)],
    },
    {
        "name": "Gustavo Aragão",
        "phone": "+55 92 98111-0606",
        "instagram": "gu.aragao",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "perdido",
        "status": "encerrada",
        "minutes": 60 * 48,
        "messages": [("in", "customer", "Por enquanto vou deixar para depois.", 60 * 48)],
    },
    {
        "name": "Helena Castro",
        "phone": "",
        "instagram": "helena.castro",
        "source": "instagram",
        "channel": "instagram",
        "stage": "novo",
        "status": "aberta",
        "minutes": 25,
        "messages": [("in", "customer", "Vi o post do vestido, ainda tem P?", 25)],
    },
    {
        "name": "Igor Nascimento",
        "phone": "+55 92 98111-0808",
        "instagram": "",
        "source": "manual",
        "channel": "whatsapp",
        "stage": "em_atendimento",
        "status": "aguardando",
        "minutes": 180,
        "messages": [("in", "customer", "Consigo trocar a cor do pedido?", 180)],
    },
]


class Command(BaseCommand):
    help = "Cria a loja, o primeiro admin e as conversas de demonstração."

    def handle(self, *args, **options):
        email = os.environ.get("SEED_ADMIN_EMAIL", "").strip().lower()
        password = os.environ.get("SEED_ADMIN_PASSWORD", "")
        if not email or len(password) < 10:
            raise CommandError("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (mínimo de 10 caracteres) no .env da raiz")

        business, _ = Business.objects.get_or_create(name="Loja Aurora")
        user = User.objects.filter(email=email).first()
        if user is None:
            User.objects.create_user(
                email=email,
                password=password,
                full_name="Administrador",
                role=User.Role.ADMIN,
                business=business,
                is_staff=True,
                is_superuser=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Admin criado: {email}"))
        else:
            self.stdout.write(f"Admin já existe: {email}")

        if Contact.objects.filter(business=business).exists():
            self.stdout.write("Dados de demonstração já existem.")
            return

        now = timezone.now()
        for item in DEMO:
            contact = Contact.objects.create(
                business=business,
                name=item["name"],
                phone=item["phone"],
                instagram_username=item["instagram"],
                source=item["source"],
            )
            conversation = Conversation.objects.create(
                business=business,
                contact=contact,
                channel=item["channel"],
                stage=item["stage"],
                status=item["status"],
                handler=Conversation.Handler.HUMANO,
                last_message_at=now - timedelta(minutes=item["minutes"]),
            )
            for direction, author, body, minutes in item["messages"]:
                Message.objects.create(
                    business=business,
                    conversation=conversation,
                    direction=direction,
                    author=author,
                    body=body,
                    created_at=now - timedelta(minutes=minutes),
                )
        self.stdout.write(self.style.SUCCESS("8 contatos de demonstração criados."))
