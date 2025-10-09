import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRightIcon, CalendarIcon, UserIcon, TagIcon, FacebookIcon, TwitterIcon, LinkedinIcon } from 'lucide-react';
export const BlogPost: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  // Mock blog posts data - in a real app, you would fetch this from an API
  const blogPosts = [{
    id: '1',
    title: 'The Health Benefits of Shea Butter',
    excerpt: "Discover the amazing skin and hair benefits of organic shea butter and how it's traditionally produced in West Africa.",
    content: `
        <p>Shea butter has been used for centuries in Africa for its remarkable healing properties. Derived from the nuts of the shea tree (Vitellaria paradoxa), this natural fat is rich in vitamins A, E, and F, offering exceptional moisturizing and anti-inflammatory benefits.</p>
        <h2>Traditional Production Methods</h2>
        <p>In West African countries like Ghana, Burkina Faso, and Mali, shea butter production is typically handled by women's cooperatives using methods passed down through generations. The process begins with collecting and cracking shea nuts, then drying and roasting them before grinding into a paste. This paste is mixed with water and churned to separate the oils, which are then boiled and filtered to produce pure shea butter.</p>
        <h2>Skin Benefits</h2>
        <ul>
          <li><strong>Deep Moisturization:</strong> Shea butter penetrates deeply into the skin without clogging pores, providing long-lasting hydration.</li>
          <li><strong>Anti-inflammatory Properties:</strong> Its cinnamic acid content helps reduce skin inflammation and redness.</li>
          <li><strong>Natural UV Protection:</strong> While not a replacement for sunscreen, shea butter offers some natural protection against UV rays (estimated SPF of 6-10).</li>
          <li><strong>Anti-aging Effects:</strong> Rich in antioxidants that combat free radicals and promote cell regeneration.</li>
        </ul>
        <h2>Hair Benefits</h2>
        <p>When used on hair, shea butter can:</p>
        <ul>
          <li>Reduce frizz and add shine</li>
          <li>Protect against heat damage</li>
          <li>Soothe dry scalp conditions</li>
          <li>Strengthen hair follicles</li>
        </ul>
        <h2>Sustainability and Fair Trade</h2>
        <p>At Banwee, we source our shea butter exclusively from women's cooperatives that practice sustainable harvesting methods. This ensures both environmental sustainability and fair wages for the women who have traditionally been the guardians of this ancient craft. Each purchase of our shea butter products directly supports these communities and helps preserve traditional knowledge.</p>
      `,
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    date: 'June 15, 2023',
    author: 'Sarah Johnson',
    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    category: 'Health & Wellness',
    tags: ['Skincare', 'Natural Products', 'Fair Trade', 'African Ingredients']
  }, {
    id: '2',
    title: 'Sustainable Farming Practices in Africa',
    excerpt: 'Learn about the traditional and innovative sustainable farming methods used by our partner farmers across Africa.',
    content: `
        <p>African agriculture has a rich heritage of sustainable farming practices that have been refined over thousands of years. Today, our partner farmers are combining these traditional methods with modern innovations to create resilient, productive, and environmentally friendly farming systems.</p>
        <h2>Traditional Wisdom</h2>
        <p>Many traditional African farming techniques were inherently sustainable long before "sustainability" became a global concern:</p>
        <ul>
          <li><strong>Intercropping:</strong> Growing multiple crops in the same field to improve soil health and reduce pest pressure.</li>
          <li><strong>Agroforestry:</strong> Integrating trees with crop production to improve soil fertility, provide shade, and create additional income streams.</li>
          <li><strong>Water harvesting:</strong> Traditional methods like zai pits (in West Africa) that capture rainwater and concentrate nutrients.</li>
          <li><strong>Seed saving:</strong> Preserving locally adapted varieties that thrive in specific microclimates without requiring extensive inputs.</li>
        </ul>
        <h2>Modern Innovations</h2>
        <p>Our partner farmers are enhancing these traditional approaches with appropriate modern techniques:</p>
        <ul>
          <li><strong>Solar-powered irrigation:</strong> Using renewable energy to power small-scale precision irrigation systems.</li>
          <li><strong>Organic pest management:</strong> Employing natural predators and plant-based pesticides to control pests without synthetic chemicals.</li>
          <li><strong>Soil testing:</strong> Analyzing soil composition to optimize natural amendments and crop selection.</li>
          <li><strong>Mobile technology:</strong> Using smartphones to access weather forecasts, market information, and agricultural advice.</li>
        </ul>
        <h2>Impact on Communities</h2>
        <p>These sustainable practices do more than protect the environment—they strengthen communities:</p>
        <ul>
          <li>Improved food security through diversified production</li>
          <li>Better health outcomes from reduced chemical exposure</li>
          <li>Economic resilience through reduced dependence on external inputs</li>
          <li>Preservation of cultural heritage and traditional knowledge</li>
        </ul>
        <h2>Our Commitment</h2>
        <p>At Banwee, we're committed to supporting these sustainable farming practices through fair prices, long-term relationships, and reinvestment in agricultural communities. When you purchase our products, you're not just getting high-quality African goods—you're supporting a vision of agriculture that respects both people and planet.</p>
      `,
    image: 'https://images.unsplash.com/photo-1595356161904-6708c97be89c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    date: 'May 22, 2023',
    author: 'Michael Osei',
    authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    category: 'Sustainability',
    tags: ['Farming', 'Sustainability', 'African Agriculture', 'Fair Trade']
  }, {
    id: '3',
    title: "Cooking with African Spices: A Beginner's Guide",
    excerpt: 'Explore the rich flavors of African cuisine with our guide to essential spices and herbs from the continent.',
    content: `
        <p>African cuisine is a vibrant tapestry of flavors, with each region boasting its own distinctive spice blends and culinary traditions. From the fiery berbere of Ethiopia to the aromatic ras el hanout of North Africa, these spices can transform ordinary dishes into extraordinary culinary experiences.</p>
        <h2>Essential African Spices</h2>
        <h3>1. Berbere</h3>
        <p>This Ethiopian spice blend is the foundation of many dishes in East African cuisine. Typically containing chili peppers, garlic, ginger, basil, korarima, rue, ajwain, nigella, and fenugreek, berbere adds a complex heat to stews, meats, and lentil dishes.</p>
        <p><strong>Try it in:</strong> Doro Wat (Ethiopian chicken stew) or sprinkled on roasted vegetables</p>
        <h3>2. Ras el Hanout</h3>
        <p>Meaning "top of the shop" in Arabic, this North African blend can contain up to 30 different spices including cardamom, cumin, clove, cinnamon, nutmeg, mace, allspice, dry ginger, chili peppers, coriander seed, peppercorn, and turmeric.</p>
        <p><strong>Try it in:</strong> Moroccan tagines or rubbed on meats before grilling</p>
        <h3>3. Harissa</h3>
        <p>This hot chili paste from North Africa contains roasted red peppers, serrano peppers, olive oil, garlic, and spices like caraway, coriander, and cumin.</p>
        <p><strong>Try it in:</strong> Soups, stews, or as a condiment for grilled meats</p>
        <h3>4. Dukkah</h3>
        <p>An Egyptian blend of nuts (typically hazelnuts), seeds, and spices like coriander, cumin, and sesame.</p>
        <p><strong>Try it in:</strong> Sprinkled over salads, vegetables, or as a dip with olive oil and bread</p>
        <h2>Cooking Tips for African Spices</h2>
        <ul>
          <li><strong>Toast before using:</strong> Briefly toast whole spices in a dry pan to release their essential oils and enhance flavor.</li>
          <li><strong>Build layers:</strong> Add spices at different stages of cooking for depth of flavor.</li>
          <li><strong>Balance heat:</strong> Many African spice blends are spicy—balance them with cooling ingredients like yogurt or coconut milk.</li>
          <li><strong>Start small:</strong> These spices are potent! Begin with small amounts and adjust to your taste.</li>
        </ul>
        <h2>Simple Starter Recipe: African-Inspired Roasted Vegetables</h2>
        <p><strong>Ingredients:</strong></p>
        <ul>
          <li>2 sweet potatoes, cubed</li>
          <li>1 eggplant, cubed</li>
          <li>2 bell peppers, chopped</li>
          <li>1 red onion, cut into wedges</li>
          <li>2 tablespoons olive oil</li>
          <li>1-2 teaspoons berbere spice blend</li>
          <li>Salt to taste</li>
          <li>Fresh cilantro for garnish</li>
        </ul>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Preheat oven to 425°F (220°C)</li>
          <li>Toss vegetables with olive oil, berbere, and salt</li>
          <li>Spread on a baking sheet and roast for 25-30 minutes until tender</li>
          <li>Garnish with fresh cilantro before serving</li>
        </ol>
        <p>At Banwee, we're proud to offer authentic African spices sourced directly from small-scale farmers across the continent. Each purchase supports traditional farming methods and helps preserve Africa's rich culinary heritage.</p>
      `,
    image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    date: 'April 10, 2023',
    author: 'Amina Diallo',
    authorImage: 'https://randomuser.me/api/portraits/women/66.jpg',
    category: 'Food & Recipes',
    tags: ['Cooking', 'Spices', 'African Cuisine', 'Recipes']
  }, {
    id: '4',
    title: 'The Story Behind Our Fair Trade Partnerships',
    excerpt: 'Meet the cooperatives and communities we work with and learn how fair trade practices are making a difference.',
    content: `
        <p>At Banwee, our products tell a story—a story of community, tradition, and ethical partnerships. Our fair trade relationships with cooperatives across Africa are at the heart of everything we do, ensuring that our business creates positive change for both people and planet.</p>
        <h2>What Fair Trade Means to Us</h2>
        <p>Fair trade is more than just paying a premium price. Our approach includes:</p>
        <ul>
          <li><strong>Direct relationships:</strong> Working directly with producer groups to eliminate unnecessary middlemen</li>
          <li><strong>Long-term commitments:</strong> Providing stability through multi-year purchasing agreements</li>
          <li><strong>Pre-financing:</strong> Offering advance payment when needed to support production</li>
          <li><strong>Capacity building:</strong> Investing in training, equipment, and infrastructure</li>
          <li><strong>Environmental stewardship:</strong> Supporting sustainable production methods</li>
        </ul>
        <h2>Meet Our Partners</h2>
        <h3>The Women's Shea Collective (Ghana)</h3>
        <p>This cooperative of 250 women in northern Ghana produces our premium shea butter using traditional methods. Before partnering with Banwee, many members struggled to get fair prices for their products in local markets. Now, with guaranteed fair trade premiums and direct export opportunities, average household incomes have increased by 47%.</p>
        <p>The group has used their community development fund to build a new water well and establish a scholarship program for girls' education.</p>
        <h3>Kilimanjaro Coffee Growers Association (Tanzania)</h3>
        <p>This association represents over 400 small-scale coffee farmers who grow Arabica beans on the slopes of Mount Kilimanjaro. Our partnership has helped them transition to organic certification, improving both environmental outcomes and the premium they receive for their beans.</p>
        <p>With fair trade premiums, they've established a processing facility that allows them to capture more value from their harvest and improve quality control.</p>
        <h3>Sahel Artisans Cooperative (Mali)</h3>
        <p>This group of 75 artisans specializes in traditional textiles and basketry. Many members are women who have become primary breadwinners for their families through their craft work. Our consistent orders provide stable income, while our design collaboration has helped create products that appeal to international markets while honoring traditional techniques.</p>
        <h2>Impact in Numbers</h2>
        <ul>
          <li>Over 1,000 producer families supported through direct fair trade relationships</li>
          <li>47% average increase in household income for partner cooperative members</li>
          <li>12 community development projects funded through fair trade premiums</li>
          <li>4,500 acres of land now under sustainable management</li>
        </ul>
        <h2>The Path Forward</h2>
        <p>We're committed to expanding our fair trade partnerships and deepening our impact. Current initiatives include:</p>
        <ul>
          <li>A solar energy project for the Women's Shea Collective processing facility</li>
          <li>Expanded organic certification support for more producer groups</li>
          <li>Development of a traceability system to allow customers to learn more about the specific producers behind each product</li>
        </ul>
        <p>When you purchase Banwee products, you're not just buying exceptional African goods—you're joining a movement for trade justice and supporting communities as they build their own path to prosperity.</p>
      `,
    image: 'https://images.unsplash.com/photo-1509099652299-30938b0aeb63?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    date: 'March 5, 2023',
    author: 'David Mensah',
    authorImage: 'https://randomuser.me/api/portraits/men/67.jpg',
    category: 'Community',
    tags: ['Fair Trade', 'Sustainability', 'Community Development', 'Social Impact']
  }];
  const post = blogPosts.find(post => post.id === id);
  if (!post) {
    return <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-main mb-4">
          Blog Post Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/blog" className="inline-flex items-center text-primary hover:underline">
          <ChevronRightIcon size={16} className="mr-1 rotate-180" />
          Back to Blog
        </Link>
      </div>;
  }
  // Related posts (excluding current post)
  const relatedPosts = blogPosts.filter(p => p.id !== id && (p.category === post.category || p.tags.some(tag => post.tags.includes(tag)))).slice(0, 3);
  return <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm">
        <Link to="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <Link to="/blog" className="text-gray-500 hover:text-primary">
          Blog
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <span className="text-main">{post.title}</span>
      </nav>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="lg:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold text-main mb-4">
            {post.title}
          </h1>
          <div className="flex items-center mb-6">
            <img src={post.authorImage} alt={post.author} className="w-10 h-10 rounded-full mr-3" />
            <div>
              <p className="font-medium text-main">{post.author}</p>
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon size={14} className="mr-1" />
                <span>{post.date}</span>
                <span className="mx-2">•</span>
                <TagIcon size={14} className="mr-1" />
                <span>{post.category}</span>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <img src={post.image} alt={post.title} className="w-full h-auto rounded-lg" />
          </div>
          <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{
          __html: post.content
        }} />
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag, index) => <Link key={index} to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700">
                {tag}
              </Link>)}
          </div>
          {/* Share buttons */}
          <div className="border-t border-b border-gray-200 py-6 mb-8">
            <p className="font-medium text-main mb-3">Share this post:</p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700">
                <FacebookIcon size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500">
                <TwitterIcon size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800">
                <LinkedinIcon size={18} />
              </a>
            </div>
          </div>
          {/* Author bio */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center mb-4">
              <img src={post.authorImage} alt={post.author} className="w-16 h-16 rounded-full mr-4" />
              <div>
                <h3 className="font-bold text-main text-lg">{post.author}</h3>
                <p className="text-gray-600">Content Writer</p>
              </div>
            </div>
            <p className="text-gray-600">
              {post.author} is a passionate writer and researcher focused on
              sustainable agriculture, fair trade practices, and traditional
              knowledge from across the African continent.
            </p>
          </div>
        </div>
        {/* Sidebar */}
        <div className="lg:w-1/3">
          {/* Categories */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="font-bold text-main text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog/category/health-wellness" className="flex items-center justify-between text-gray-600 hover:text-primary">
                  <span>Health & Wellness</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    12
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/blog/category/sustainability" className="flex items-center justify-between text-gray-600 hover:text-primary">
                  <span>Sustainability</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    8
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/blog/category/food-recipes" className="flex items-center justify-between text-gray-600 hover:text-primary">
                  <span>Food & Recipes</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    15
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/blog/category/community" className="flex items-center justify-between text-gray-600 hover:text-primary">
                  <span>Community</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    7
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          {/* Recent posts */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="font-bold text-main text-lg mb-4">Recent Posts</h3>
            <div className="space-y-4">
              {blogPosts.slice(0, 3).map(recentPost => <div key={recentPost.id} className="flex">
                  <img src={recentPost.image} alt={recentPost.title} className="w-16 h-16 object-cover rounded-md mr-3" />
                  <div>
                    <Link to={`/blog/${recentPost.id}`} className="font-medium text-main hover:text-primary line-clamp-2">
                      {recentPost.title}
                    </Link>
                    <p className="text-xs text-gray-500">{recentPost.date}</p>
                  </div>
                </div>)}
            </div>
          </div>
          {/* Popular tags */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-main text-lg mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Link to="/blog/tag/fair-trade" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700">
                Fair Trade
              </Link>
              <Link to="/blog/tag/sustainability" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700">
                Sustainability
              </Link>
              <Link to="/blog/tag/recipes" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700">
                Recipes
              </Link>
              <Link to="/blog/tag/skincare" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700">
                Skincare
              </Link>
              <Link to="/blog/tag/african-ingredients" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700">
                African Ingredients
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Related posts */}
      {relatedPosts.length > 0 && <div className="mt-12">
          <h2 className="text-2xl font-bold text-main mb-6">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map(relatedPost => <div key={relatedPost.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <img src={relatedPost.image} alt={relatedPost.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span>{relatedPost.date}</span>
                    <span className="mx-2">•</span>
                    <span>{relatedPost.category}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-main mb-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <Link to={`/blog/${relatedPost.id}`} className="text-primary hover:underline font-medium">
                    Read More
                  </Link>
                </div>
              </div>)}
          </div>
        </div>}
    </div>;
};