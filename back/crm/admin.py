from django.contrib import admin

from .models import Business, Contact, Conversation, Message, User


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "business", "is_active")
    search_fields = ("email", "full_name")
    list_filter = ("role",)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "source", "business")
    search_fields = ("name", "phone", "instagram_username")


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("contact", "channel", "stage", "status", "handler", "business")
    list_filter = ("channel", "stage", "handler")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "direction", "author", "created_at")
    search_fields = ("body",)
