from datetime import timedelta

from django.test import Client, TestCase
from django.utils import timezone

from crm.models import Business, Contact, Conversation, LoginAttempt, Message, User


class CrmApiTests(TestCase):
    def setUp(self):
        self.loja = Business.objects.create(name="Loja A")
        self.outra = Business.objects.create(name="Loja B")
        self.admin = User.objects.create_user(
            email="admin@loja.local",
            password="senha-segura-10",
            full_name="Admin",
            role=User.Role.ADMIN,
            business=self.loja,
        )
        self.contato = Contact.objects.create(business=self.loja, name="Ana", phone="92999990000", source="whatsapp")
        self.conversa = Conversation.objects.create(
            business=self.loja,
            contact=self.contato,
            channel="whatsapp",
            last_message_at=timezone.now(),
        )
        Message.objects.create(
            business=self.loja,
            conversation=self.conversa,
            direction="in",
            author="customer",
            body="Oi",
        )
        outro_contato = Contact.objects.create(business=self.outra, name="Segredo", source="instagram")
        self.conversa_alheia = Conversation.objects.create(
            business=self.outra,
            contact=outro_contato,
            channel="instagram",
            last_message_at=timezone.now(),
        )

    def test_login_recusa_csrf_ausente(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post(
            "/api/auth/login",
            data={"email": "admin@loja.local", "password": "senha-segura-10"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_login_nao_revela_se_o_email_existe(self):
        inexistente = self.client.post(
            "/api/auth/login",
            data={"email": "ninguem@loja.local", "password": "senha-segura-10"},
            content_type="application/json",
        )
        senha_errada = self.client.post(
            "/api/auth/login",
            data={"email": "admin@loja.local", "password": "senha-segura-99"},
            content_type="application/json",
        )
        self.assertEqual(inexistente.status_code, 401)
        self.assertEqual(inexistente.json(), senha_errada.json())

    def test_bloqueia_depois_de_cinco_tentativas(self):
        for _ in range(5):
            LoginAttempt.objects.create(email="admin@loja.local", created_at=timezone.now())
        response = self.client.post(
            "/api/auth/login",
            data={"email": "admin@loja.local", "password": "senha-segura-10"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 429)

    def test_sessao_e_cookie_httponly(self):
        response = self.client.post(
            "/api/auth/login",
            data={"email": "admin@loja.local", "password": "senha-segura-10"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        cookie = response.cookies["crm_session"]
        self.assertTrue(cookie["httponly"])
        me = self.client.get("/api/auth/me")
        self.assertEqual(me.json()["user"]["businessName"], "Loja A")

    def test_nao_enxerga_conversa_de_outro_negocio(self):
        self.client.force_login(self.admin)
        response = self.client.get(f"/api/conversations/{self.conversa_alheia.id}")
        self.assertEqual(response.status_code, 404)
        lista = self.client.get("/api/conversations")
        ids = [item["id"] for item in lista.json()["conversations"]]
        self.assertIn(str(self.conversa.id), ids)
        self.assertNotIn(str(self.conversa_alheia.id), ids)

    def test_resposta_fica_no_banco_e_assume_humano(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            f"/api/conversations/{self.conversa.id}/messages",
            data={"body": "Já separei a bolsa."},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.conversa.refresh_from_db()
        self.assertEqual(self.conversa.handler, "humano")
        self.assertTrue(
            Message.objects.filter(conversation=self.conversa, body="Já separei a bolsa.", author="human").exists()
        )

    def test_webhook_da_meta_recusa_tudo(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post("/api/webhooks/meta", data=b"{}", content_type="application/json").status_code, 401)
        self.assertEqual(client.get("/api/webhooks/meta").status_code, 401)

    def test_tentativa_antiga_nao_conta(self):
        LoginAttempt.objects.create(email="admin@loja.local", created_at=timezone.now() - timedelta(minutes=20))
        response = self.client.post(
            "/api/auth/login",
            data={"email": "admin@loja.local", "password": "senha-segura-10"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
