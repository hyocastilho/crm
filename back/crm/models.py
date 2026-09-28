import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("E-mail obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.ADMIN)
        if extra.get("is_staff") is not True or extra.get("is_superuser") is not True:
            raise ValueError("Superusuário precisa de is_staff e is_superuser.")
        return self.create_user(email, password, **extra)


class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "negócio"
        verbose_name_plural = "negócios"

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrador"
        ATENDENTE = "atendente", "Atendente"

    username = None
    email = models.EmailField("e-mail", unique=True)
    full_name = models.CharField("nome", max_length=200, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ATENDENTE)
    business = models.ForeignKey(
        Business,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="users",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Meta:
        verbose_name = "usuário"
        verbose_name_plural = "usuários"

    def __str__(self):
        return self.email


class Contact(models.Model):
    class Source(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        INSTAGRAM = "instagram", "Instagram"
        MANUAL = "manual", "Manual"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30, blank=True)
    instagram_username = models.CharField(max_length=60, blank=True)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["business", "name"])]
        verbose_name = "contato"
        verbose_name_plural = "contatos"

    def __str__(self):
        return self.name


class Conversation(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        INSTAGRAM = "instagram", "Instagram"

    class Stage(models.TextChoices):
        NOVO = "novo", "Novo"
        EM_ATENDIMENTO = "em_atendimento", "Em atendimento"
        ORCAMENTO = "orcamento", "Orçamento"
        PEDIDO = "pedido", "Pedido"
        PAGO = "pago", "Pago"
        PERDIDO = "perdido", "Perdido"

    class Status(models.TextChoices):
        ABERTA = "aberta", "Aberta"
        AGUARDANDO = "aguardando", "Aguardando"
        ENCERRADA = "encerrada", "Encerrada"

    class Handler(models.TextChoices):
        BOT = "bot", "Robô"
        HUMANO = "humano", "Humano"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="conversations")
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="conversations")
    channel = models.CharField(max_length=20, choices=Channel.choices)
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.NOVO)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ABERTA)
    handler = models.CharField(max_length=20, choices=Handler.choices, default=Handler.HUMANO)
    assignee = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_conversations",
    )
    last_message_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["business", "-last_message_at"])]
        verbose_name = "conversa"
        verbose_name_plural = "conversas"

    def __str__(self):
        return f"{self.contact} · {self.channel}"


class Message(models.Model):
    class Direction(models.TextChoices):
        IN = "in", "Entrada"
        OUT = "out", "Saída"

    class Author(models.TextChoices):
        CUSTOMER = "customer", "Cliente"
        BOT = "bot", "Robô"
        HUMAN = "human", "Humano"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="messages")
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    direction = models.CharField(max_length=8, choices=Direction.choices)
    author = models.CharField(max_length=16, choices=Author.choices)
    body = models.TextField(max_length=4000)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["conversation", "created_at"])]
        verbose_name = "mensagem"
        verbose_name_plural = "mensagens"

    def __str__(self):
        return self.body[:40]


class LoginAttempt(models.Model):
    email = models.EmailField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["email", "created_at"])]
