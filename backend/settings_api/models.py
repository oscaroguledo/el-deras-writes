from django.db import models
from django.core.exceptions import ValidationError

class ContactInfo(models.Model):
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    class Meta:
        verbose_name = "Contact Information"
        verbose_name_plural = "Contact Information"

    def __str__(self):
        return "Site Contact Information"

    def save(self, *args, **kwargs):
        # Ensure that there's only one instance of ContactInfo
        if not self.pk and ContactInfo.objects.exists():
            raise ValidationError('There can be only one ContactInfo instance.')
        return super(ContactInfo, self).save(*args, **kwargs)
