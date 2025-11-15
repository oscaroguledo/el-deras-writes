import random
from django.core.management.base import BaseCommand
from blog.models import CustomUser, TITLE_CHOICES

class Command(BaseCommand):
    help = 'Updates existing CustomUser instances with a random title from TITLE_CHOICES if their title field is empty.'

    def handle(self, *args, **options):
        updated_count = 0
        for user in CustomUser.objects.all():
            if not user.title: # Check if title is empty or None
                user.title = random.choice([choice[0] for choice in TITLE_CHOICES])
                user.save()
                updated_count += 1
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} CustomUser titles.'))
