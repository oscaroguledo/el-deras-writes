from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    CustomUser, Article, Category, Tag, Comment, 
    ContactInfo, VisitorCount, Visit, Feedback
)


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    """Custom User Admin"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    readonly_fields = ('id', 'date_joined', 'last_login')
    
    fieldsets = (
        ('Personal Info', {
            'fields': ('username', 'email', 'first_name', 'last_name', 'bio')
        }),
        ('Permissions', {
            'fields': ('user_type', 'is_staff', 'is_active', 'is_superuser')
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined')
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Personal Info', {
            'fields': ('username', 'email', 'password', 'first_name', 'last_name', 'bio')
        }),
        ('Permissions', {
            'fields': ('user_type', 'is_staff', 'is_active', 'is_superuser')
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Category Admin"""
    list_display = ('name', 'description', 'article_count')
    search_fields = ('name', 'description')
    readonly_fields = ('id',)
    
    def article_count(self, obj):
        return obj.articles.count()
    article_count.short_description = 'Articles'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Tag Admin"""
    list_display = ('name', 'article_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name',)
    readonly_fields = ('id', 'created_at')
    
    def article_count(self, obj):
        return obj.articles.count()
    article_count.short_description = 'Articles'


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Article Admin"""
    list_display = ('title', 'author', 'category', 'status', 'featured', 'comment_count', 'views', 'published_at', 'created_at')
    list_filter = ('status', 'category', 'created_at', 'published_at', 'featured')
    search_fields = ('title', 'excerpt', 'content')
    list_editable = ('status', 'featured')
    readonly_fields = ('id', 'slug', 'created_at', 'updated_at', 'views')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'excerpt', 'content', 'image')
        }),
        ('Classification', {
            'fields': ('category', 'tags', 'author')
        }),
        ('Publishing', {
            'fields': ('status', 'featured', 'published_at', 'readTime')
        }),
        ('Metadata', {
            'fields': ('id', 'views', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ('tags',)
    
    def comment_count(self, obj):
        return obj.comments.count()
    comment_count.short_description = 'Comments'


class CommentReplyInline(admin.TabularInline):
    """Inline for comment replies"""
    model = Comment
    fk_name = 'parent'
    extra = 0
    fields = ('author', 'content', 'approved', 'is_flagged', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Comment Admin"""
    list_display = ('content_preview', 'author', 'article', 'parent', 'approved', 'is_flagged', 'reply_count', 'created_at')
    list_filter = ('approved', 'is_flagged', 'created_at')
    search_fields = ('content', 'author__username', 'article__title')
    list_editable = ('approved', 'is_flagged')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Comment Details', {
            'fields': ('article', 'author', 'parent', 'content')
        }),
        ('Moderation', {
            'fields': ('approved', 'is_flagged')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [CommentReplyInline]
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    def reply_count(self, obj):
        return obj.replies.count()
    reply_count.short_description = 'Replies'
    
    actions = ['approve_comments', 'flag_comments', 'unflag_comments']
    
    def approve_comments(self, request, queryset):
        updated = queryset.update(approved=True)
        self.message_user(request, f'{updated} comments were approved.')
    approve_comments.short_description = 'Approve selected comments'
    
    def flag_comments(self, request, queryset):
        updated = queryset.update(is_flagged=True)
        self.message_user(request, f'{updated} comments were flagged.')
    flag_comments.short_description = 'Flag selected comments'
    
    def unflag_comments(self, request, queryset):
        updated = queryset.update(is_flagged=False)
        self.message_user(request, f'{updated} comments were unflagged.')
    unflag_comments.short_description = 'Unflag selected comments'


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    """Contact Info Admin"""
    list_display = ('address', 'phone', 'email')
    readonly_fields = ('id',)
    
    def has_add_permission(self, request):
        # Only allow one contact info record
        return not ContactInfo.objects.exists()


@admin.register(VisitorCount)
class VisitorCountAdmin(admin.ModelAdmin):
    """Visitor Count Admin"""
    list_display = ('count', 'id')
    readonly_fields = ('id', 'count')
    
    def has_add_permission(self, request):
        # Only allow one visitor count record
        return not VisitorCount.objects.exists()
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    """Visit Admin"""
    list_display = ('date', 'count')
    list_filter = ('date',)
    readonly_fields = ('date', 'count')
    date_hierarchy = 'date'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """Feedback Admin"""
    list_display = ('name', 'email', 'subject_preview', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email')
        }),
        ('Feedback', {
            'fields': ('subject', 'message')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def subject_preview(self, obj):
        return obj.subject[:30] + '...' if len(obj.subject) > 30 else obj.subject
    subject_preview.short_description = 'Subject'


# Customize admin site
admin.site.site_header = "El Deras Writes Admin"
admin.site.site_title = "El Deras Writes Admin Portal"
admin.site.index_title = "Welcome to El Deras Writes Administration"