import os
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from crm.demo import DEMO, DEMO_BUSINESS_NAME, DEMO_KEY
from crm.models import Business, Contact, Conversation, Message, User


class Command(BaseCommand):
    help = "Cria a loja, o login e as conversas de demonstração. Não mistura com dados reais."

    def handle(self, *args, **options):
        email = os.environ.get("SEED_ADMIN_EMAIL", "").strip().lower()
        password = os.environ.get("SEED_ADMIN_PASSWORD", "")
        if not email or len(password) < 10:
            raise CommandError("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env da raiz")

        business = Business.objects.filter(demo_key=DEMO_KEY).first()
        if business is None:
            business = Business.objects.filter(name=DEMO_BUSINESS_NAME, demo_key__isnull=True).first()
            if business is None:
                business = Business.objects.create(name=DEMO_BUSINESS_NAME, demo_key=DEMO_KEY)
            else:
                business.demo_key = DEMO_KEY
                business.save(update_fields=["demo_key", "updated_at"])

        user = User.objects.filter(email=email).first()
        if user is None:
            User.objects.create_user(
                email=email,
                password=password,
                full_name="Administrador",
                role=User.Role.ADMIN,
                business=business,
                is_demo=True,
                is_staff=True,
                is_superuser=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Login de demonstração criado: {email}"))
        else:
            user.is_demo = True
            user.business = business
            user.save(update_fields=["is_demo", "business"])
            self.stdout.write(f"Login de demonstração já existe: {email}")

        if Contact.objects.filter(business=business).exists():
            self.stdout.write("Conversas de demonstração já existem.")
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
