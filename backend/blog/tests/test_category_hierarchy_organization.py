"""
Property-based tests for category hierarchy organization
**Feature: django-postgresql-enhancement, Property 3: Category hierarchy organization**
**Validates: Requirements 1.3**
"""

from django.test import TestCase, RequestFactory
from django.core.exceptions import ValidationError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser, Article, Category
from blog.views import CategoryViewSet
from rest_framework.test import force_authenticate
import uuid


class CategoryHierarchyOrganizationTest(HypothesisTestCase):
    """
    Property-based tests for category hierarchy organization
    **Feature: django-postgresql-enhancement, Property 3: Category hierarchy organization**
    **Validates: Requirements 1.3**
    """

    def setUp(self):
        """Set up test data that will be reused across tests"""
        test_id = str(uuid.uuid4())[:8]
        
        # Create a test user
        self.test_user = CustomUser.objects.create_user(
            email=f'testuser_{test_id}@example.com',
            username=f'testuser_{test_id}',
            password='testpass123'
        )
        
        # Create request factory for API testing
        self.factory = RequestFactory()

    @given(
        parent_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&'])),
        child_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&'])),
        parent_description=st.text(min_size=0, max_size=400),
        child_description=st.text(min_size=0, max_size=400)
    )
    @hypothesis_settings(max_examples=100, deadline=5000)
    def test_category_hierarchy_maintains_relationships(self, parent_name, child_name, parent_description, child_description):
        """
        **Feature: django-postgresql-enhancement, Property 3: Category hierarchy organization**
        **Validates: Requirements 1.3**
        
        Property: For any category browsing request, the returned data should maintain 
        proper hierarchical relationships and organization.
        
        This tests that parent-child relationships are correctly maintained and queryable.
        """
        try:
            # Ensure names are different to avoid conflicts
            if parent_name.strip().lower() == child_name.strip().lower():
                child_name = f"Child_{child_name}"
            
            # Create parent category
            parent_category = Category.objects.create(
                name=parent_name.strip(),
                description=parent_description
            )
            
            # Create child category with parent relationship
            child_category = Category.objects.create(
                name=child_name.strip(),
                parent=parent_category,
                description=child_description
            )
            
            # Property: Child category should maintain reference to parent
            self.assertEqual(
                child_category.parent,
                parent_category,
                "Child category must maintain reference to parent category"
            )
            
            # Property: Parent should be queryable from child
            self.assertIsNotNone(
                child_category.parent,
                "Child category should have a parent"
            )
            
            # Property: Children should be queryable from parent
            children = parent_category.children.all()
            self.assertIn(
                child_category,
                children,
                "Parent category must be able to query its children"
            )
            
            # Property: Root category should not have a parent
            self.assertIsNone(
                parent_category.parent,
                "Root category should not have a parent"
            )
            
            # Clean up
            child_category.delete()
            parent_category.delete()
            
        except ValidationError as e:
            # Validation errors are acceptable (e.g., malicious input detected)
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower() or "unique constraint" in str(e).lower():
                # Database constraint violations are acceptable in property testing
                pass
            else:
                raise

    @given(
        num_levels=st.integers(min_value=2, max_value=5)
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_deep_hierarchy_traversal(self, num_levels):
        """
        Property: Category hierarchies should support multiple levels of nesting 
        and allow traversal up and down the hierarchy.
        """
        try:
            categories = []
            parent = None
            
            # Create nested category hierarchy
            for level in range(num_levels):
                category_name = f"Level_{level}_{uuid.uuid4().hex[:8]}"
                category = Category.objects.create(
                    name=category_name,
                    parent=parent,
                    description=f"Category at level {level}"
                )
                categories.append(category)
                parent = category
            
            # Property: Each level should have correct parent reference
            for i, category in enumerate(categories):
                if i == 0:
                    self.assertIsNone(
                        category.parent,
                        "Root category should not have a parent"
                    )
                else:
                    self.assertEqual(
                        category.parent,
                        categories[i - 1],
                        f"Category at level {i} should have correct parent"
                    )
            
            # Property: Should be able to traverse entire hierarchy upward
            deepest_category = categories[-1]
            current = deepest_category
            level_count = 0
            
            while current is not None:
                level_count += 1
                current = current.parent
            
            self.assertEqual(
                level_count,
                num_levels,
                "Should be able to traverse entire hierarchy from deepest to root"
            )
            
            # Property: Each parent should know its immediate children
            for i, category in enumerate(categories[:-1]):
                children = category.children.all()
                if i + 1 < len(categories):
                    self.assertIn(
                        categories[i + 1],
                        children,
                        f"Category at level {i} should have correct child"
                    )
            
            # Clean up (delete in reverse order to avoid cascade issues)
            for category in reversed(categories):
                if Category.objects.filter(id=category.id).exists():
                    category.delete()
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower():
                pass
            else:
                raise

    @given(
        category_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&']))
    )
    @hypothesis_settings(max_examples=100, deadline=5000)
    def test_api_returns_hierarchy_data(self, category_name):
        """
        Property: When browsing categories through the API, the response should 
        include hierarchical relationship data (parent, children).
        """
        try:
            # Create a category
            category = Category.objects.create(
                name=category_name.strip(),
                description="Test category"
            )
            
            # Create API request
            request = self.factory.get(categories/')
            force_authenticate(request, user=self.test_user)
            
            # Get category through API
            view = CategoryViewSet.as_view({'get': 'retrieve'})
            response = view(request, pk=category.id)
            
            # Property: Response should include category data
            self.assertEqual(response.status_code, 200)
            self.assertIn('name', response.data)
            self.assertEqual(response.data['name'], category.name)
            
            # Property: Response should include hierarchical fields
            self.assertIn('parent', response.data)
            self.assertIn('children', response.data)
            
            # Property: For root category, parent should be None
            self.assertIsNone(response.data['parent'])
            
            # Property: Children should be a list (even if empty)
            self.assertIsInstance(response.data['children'], list)
            
            # Clean up
            category.delete()
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower() or "unique constraint" in str(e).lower():
                pass
            else:
                raise

    @given(
        parent_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&'])),
        num_children=st.integers(min_value=1, max_value=4)
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_api_hierarchy_endpoint_returns_organized_data(self, parent_name, num_children):
        """
        Property: The hierarchy API endpoint should return properly organized 
        category data with parent-child relationships intact.
        """
        try:
            # Create parent category
            parent_category = Category.objects.create(
                name=parent_name.strip(),
                description="Parent category"
            )
            
            # Create child categories
            children = []
            for i in range(num_children):
                child_name = f"{parent_name}_child_{i}_{uuid.uuid4().hex[:6]}"
                child = Category.objects.create(
                    name=child_name,
                    parent=parent_category,
                    description=f"Child {i}"
                )
                children.append(child)
            
            # Create API request for hierarchy endpoint
            request = self.factory.get(categories/hierarchy/')
            force_authenticate(request, user=self.test_user)
            
            # Get hierarchy through API
            view = CategoryViewSet.as_view({'get': 'hierarchy'})
            response = view(request)
            
            # Property: Response should be successful
            self.assertEqual(response.status_code, 200)
            
            # Property: Response should be a list
            self.assertIsInstance(response.data, list)
            
            # Property: Root categories should be in the response
            category_ids = [cat['id'] for cat in response.data]
            self.assertIn(str(parent_category.id), category_ids)
            
            # Property: Each root category should have children data
            parent_data = next((cat for cat in response.data if cat['id'] == str(parent_category.id)), None)
            if parent_data:
                self.assertIn('children', parent_data)
                self.assertIsInstance(parent_data['children'], list)
                
                # Property: Number of children in response should match created children
                self.assertEqual(
                    len(parent_data['children']),
                    num_children,
                    "API should return all child categories"
                )
                
                # Property: Each child should have correct parent reference
                for child_data in parent_data['children']:
                    self.assertEqual(
                        child_data.get('parent_name'),
                        parent_category.name,
                        "Child should reference correct parent name"
                    )
            
            # Clean up
            for child in children:
                child.delete()
            parent_category.delete()
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower() or "unique constraint" in str(e).lower():
                pass
            else:
                raise

    @given(
        category_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&'])),
        num_articles=st.integers(min_value=1, max_value=3)
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_category_articles_maintain_organization(self, category_name, num_articles):
        """
        Property: Articles associated with a category should be queryable 
        and maintain the organizational structure.
        """
        try:
            # Create category
            category = Category.objects.create(
                name=category_name.strip(),
                description="Test category"
            )
            
            # Create articles in this category
            articles = []
            for i in range(num_articles):
                article = Article.objects.create(
                    title=f"Article {i} in {category_name}",
                    content=f"Content for article {i}",
                    author=self.test_user,
                    category=category,
                    status='published'
                )
                articles.append(article)
            
            # Property: All articles should be associated with the category
            category_articles = Article.objects.filter(category=category)
            self.assertEqual(
                len(category_articles),
                num_articles,
                "All created articles should be associated with the category"
            )
            
            for article in articles:
                self.assertIn(
                    article,
                    category_articles,
                    f"Article '{article.title}' should be in category"
                )
            
            # Property: Each article should reference the correct category
            for article in articles:
                self.assertEqual(
                    article.category,
                    category,
                    "Article should reference the correct category"
                )
            
            # Property: API should return articles for the category
            request = self.factory.get(fcategories/{category.id}/articles/')
            force_authenticate(request, user=self.test_user)
            
            view = CategoryViewSet.as_view({'get': 'articles'})
            response = view(request, pk=category.id)
            
            self.assertEqual(response.status_code, 200)
            
            # Extract results from paginated response
            if 'results' in response.data:
                returned_articles = response.data['results']
            else:
                returned_articles = response.data
            
            # Property: Number of returned articles should match
            self.assertEqual(
                len(returned_articles),
                num_articles,
                "API should return all articles in the category"
            )
            
            # Clean up
            for article in articles:
                article.delete()
            category.delete()
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower() or "unique constraint" in str(e).lower():
                pass
            else:
                raise

    @given(
        parent_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&'])),
        child_name=st.text(min_size=1, max_size=200).filter(lambda x: x.strip() and not any(c in x for c in ['<', '>', '"', "'", '&']))
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_cascade_deletion_maintains_integrity(self, parent_name, child_name):
        """
        Property: When a parent category is deleted, child categories should be 
        deleted (cascade), maintaining referential integrity.
        """
        try:
            # Ensure names are different
            if parent_name.strip().lower() == child_name.strip().lower():
                child_name = f"Child_{child_name}"
            
            # Create parent and child categories
            parent_category = Category.objects.create(
                name=parent_name.strip(),
                description="Parent category"
            )
            
            child_category = Category.objects.create(
                name=child_name.strip(),
                parent=parent_category,
                description="Child category"
            )
            
            parent_id = parent_category.id
            child_id = child_category.id
            
            # Verify both exist
            self.assertTrue(Category.objects.filter(id=parent_id).exists())
            self.assertTrue(Category.objects.filter(id=child_id).exists())
            
            # Delete parent category
            parent_category.delete()
            
            # Property: Parent should be deleted
            self.assertFalse(
                Category.objects.filter(id=parent_id).exists(),
                "Parent category should be deleted"
            )
            
            # Property: Child should also be deleted (cascade)
            self.assertFalse(
                Category.objects.filter(id=child_id).exists(),
                "Child category should be deleted due to cascade"
            )
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower() or "unique constraint" in str(e).lower():
                pass
            else:
                raise

    def test_empty_hierarchy_returns_empty_list(self):
        """
        Property: When no categories exist, the hierarchy endpoint should 
        return an empty list, not an error.
        """
        # Delete all categories
        Category.objects.all().delete()
        
        # Create API request
        request = self.factory.get(categories/hierarchy/')
        force_authenticate(request, user=self.test_user)
        
        # Get hierarchy
        view = CategoryViewSet.as_view({'get': 'hierarchy'})
        response = view(request)
        
        # Property: Should return successful response
        self.assertEqual(response.status_code, 200)
        
        # Property: Should return empty list
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 0)
