from django.core.management.base import BaseCommand
from django.db import transaction

from crm.demo import DEMO_KEY
from crm.models import Business, User


class Command(BaseCommand):
    help = "Apaga a loja, o login e as conversas marcados como demonstração."

    def handle(self, *args, **options):
        businesses = Business.objects.filter(demo_key=DEMO_KEY)
        if not businesses.exists():
            self.stdout.write("Não há dados de demonstração.")
            return
        with transaction.atomic():
            usuarios = User.objects.filter(is_demo=True) | User.objects.filter(business__in=businesses)
            apagados = usuarios.distinct().count()
            usuarios.distinct().delete()
            lojas = businesses.count()
            businesses.delete()
        self.stdout.write(self.style.SUCCESS(f"Demonstração removida: {lojas} loja(s), {apagados} login(s)."))
