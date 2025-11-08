from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Category, Tag, Article, Comment
from ckeditor.admin import CKEditorModelAdmin

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('user_type', 'bio',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('user_type', 'bio',)}),
    )

class ArticleAdmin(CKEditorModelAdmin):
    list_display = ('title', 'author', 'category', 'status', 'created_at')
    list_filter = ('status', 'category', 'tags')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    filter_horizontal = ('tags',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Article, ArticleAdmin)
admin.site.register(Comment)
