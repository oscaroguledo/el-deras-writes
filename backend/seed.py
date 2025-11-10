import os
import django
import uuid
from datetime import datetime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "blog_project.settings")
django.setup()


def seed_data():
    from django.contrib.auth.models import User
    from blog.models import Article, Category, CustomUser, ContactInfo # Import ContactInfo

    # Seed ContactInfo
    if not ContactInfo.objects.exists():
        ContactInfo.objects.create(
            address="123 Main St, Anytown, USA",
            phone="+1 (555) 123-4567",
            email="info@el-deras-writes.com",
            whatsapp_link="https://wa.me/15551234567",
            tiktok_link="https://www.tiktok.com/@el_deras_writes",
            instagram_link="https://www.instagram.com/el_deras_writes",
            facebook_link="https://www.facebook.com/el_deras_writes"
        )
        print("ContactInfo seeded successfully!")
    else:
        print("ContactInfo already exists.")

    mockArticles = [
      {
        "_id": "1",
        "title": "The Art of Minimalist Design in Modern Digital Products",
        "excerpt":
          "Exploring how simplicity and thoughtful restraint create more powerful user experiences and lasting impressions in today's digital landscape.",
        "content":
          """<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Minimalist design isn't just about removing elements; it's about understanding what's truly essential. By carefully considering each component of a digital product, designers can create experiences that feel intuitive and effortless. The key is to focus on the core functionality and remove anything that doesn't directly contribute to the user's goals.</p><p>Research has shown that users make judgments about a website's appeal within 50 milliseconds. A clean, minimalist design helps create a positive first impression and reduces cognitive load. By eliminating unnecessary distractions, users can focus on what matters most.</p>""",
        "image": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
        "category": "Design",
        "author": "Emma Richardson",
        "authorImage": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        "readTime": "8 min read",
        "createdAt": "2023-06-12T00:00:00Z",
        "updatedAt": "2023-06-12T00:00:00Z",
      },
      {
        "_id": "2",
        "title": "The Psychology Behind Effective User Interfaces",
        "excerpt":
          "Understanding the cognitive principles that make digital interfaces intuitive and engaging for users.",
        "content":
          """<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>The human mind processes information in specific ways, and understanding these patterns is essential for designing effective interfaces. Principles like the Gestalt laws of perception, cognitive load theory, and Fitts's Law all influence how users interact with digital products.</p><p>For example, the principle of proximity suggests that elements placed close together are perceived as related. By grouping similar functions together, designers can create interfaces that feel organized and intuitive. Similarly, the principle of consistency helps users apply existing knowledge to new situations, reducing the learning curve.</p>""",
        "image": "https://images.unsplash.com/photo-1555421689-3f034debb7a6",
        "category": "UX Design",
        "author": "Daniel Lee",
        "authorImage": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        "readTime": "6 min read",
        "createdAt": "2023-05-28T00:00:00Z",
        "updatedAt": "2023-05-28T00:00:00Z",
      },
      {
        "_id": "3",
        "title": "How Blockchain is Revolutionizing Digital Identity",
        "excerpt":
          "Exploring the potential of blockchain technology to create secure, user-controlled digital identity systems.",
        "content":
          """<p>Digital identity is one of the most pressing challenges of our connected world. Traditional systems are fragmented, insecure, and often place control in the hands of corporations rather than individuals.</p><p>Blockchain technology offers a promising alternative by enabling self-sovereign identity—a model where users control their personal data and share only what's necessary with service providers. This decentralized approach eliminates single points of failure and gives people ownership of their digital selves.</p><p>Several promising projects are already implementing blockchain-based identity solutions. From government initiatives to open-source frameworks, these systems are laying the groundwork for a more secure and privacy-respecting internet.</p><p>However, challenges remain, including scalability issues, regulatory hurdles, and the need for widespread adoption. As these technologies mature, we may see a fundamental shift in how digital identity works online.</p>""",
        "image": "https://images.unsplash.com/photo-1639762681057-408e52192e55",
        "category": "Technology",
        "author": "Michael Chen",
        "authorImage": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        "readTime": "7 min read",
        "createdAt": "2023-07-15T00:00:00Z",
        "updatedAt": "2023-07-15T00:00:00Z",
      },
      {
        "_id": "4",
        "title": "The Rise of No-Code Development Platforms",
        "excerpt":
          "How no-code tools are democratizing software creation and changing the technology landscape.",
        "content":
          """<p>Software development has traditionally been the domain of those with programming expertise, creating a significant barrier to entry for many innovative ideas. No-code development platforms are changing this paradigm by enabling people with limited technical knowledge to create functional applications.</p><p>These platforms use visual interfaces and drag-and-drop components to replace traditional coding. Users can create everything from simple automations to complex business applications without writing a single line of code.</p><p>The implications are far-reaching. Small businesses can now develop custom solutions without expensive development teams. Entrepreneurs can quickly prototype and test ideas. Even within established organizations, no-code tools are enabling "citizen developers" to solve problems without waiting for IT resources.</p><p>While these platforms won't replace traditional development for complex or highly specialized applications, they're expanding the pool of people who can participate in digital creation—potentially unleashing a new wave of innovation.</p>""",
        "image": "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e",
        "category": "Technology",
        "author": "Sarah Johnson",
        "authorImage": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
        "readTime": "5 min read",
        "createdAt": "2023-08-03T00:00:00Z",
        "updatedAt": "2023-08-03T00:00:00Z",
      },
      {
        "_id": "5",
        "title": "Sustainable Architecture: Building for a Better Future",
        "excerpt":
          "Innovative approaches to designing buildings that minimize environmental impact while maximizing human wellbeing.",
        "content":
          """<p>Architecture has always reflected society's values and aspirations. Today, as we face unprecedented environmental challenges, sustainable architecture is emerging as both a necessity and an opportunity for innovation.</p><p>Modern sustainable buildings go far beyond simple energy efficiency. They incorporate regenerative design principles, biophilic elements that connect occupants with nature, and circular economy approaches that minimize waste throughout the building lifecycle.</p><p>Materials innovation is driving much of this progress. From mass timber construction that sequesters carbon to recycled and biodegradable building components, architects now have a growing toolkit of sustainable options.</p><p>Perhaps most exciting is the development of "living buildings" that generate more energy than they consume, collect and purify their own water, and actively improve the surrounding environment. These projects demonstrate that our built environment can be a positive force for ecological restoration.</p>""",
        "image": "https://images.unsplash.com/photo-1518005020951-eccb494ad742",
        "category": "Architecture",
        "author": "Carlos Rodriguez",
        "authorImage": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
        "readTime": "9 min read",
        "createdAt": "2023-06-22T00:00:00Z",
        "updatedAt": "2023-06-22T00:00:00Z",
      },
      {
        "_id": "6",
        "title":
          "The Science of Productivity: Evidence-Based Approaches to Getting More Done",
        "excerpt":
          "Research-backed strategies for improving focus, managing energy, and accomplishing meaningful work in a distracted world.",
        "content":
          """<p>In our hyperconnected age, maintaining focus and productivity has become increasingly challenging. The average knowledge worker is interrupted every 11 minutes and takes 25 minutes to return to their original task. This fragmentation has real costs for both individuals and organizations.</p><p>Cognitive science offers valuable insights for counteracting these trends. Research shows that rather than trying to multitask (which reduces cognitive performance), we should embrace strategic monotasking—giving our full attention to one task for defined periods.</p><p>The widely used Pomodoro Technique, which involves 25-minute focused work sessions separated by short breaks, aligns with our brain's natural attention cycles. Similarly, time-blocking—scheduling specific activities rather than working from never-ending to-do lists—helps combat decision fatigue and procrastination.</p><p>Beyond techniques, productivity is fundamentally about energy management. Our cognitive capabilities fluctuate throughout the day based on our circadian rhythms. By identifying our peak performance periods and aligning our most demanding tasks with these windows, we can accomplish more with less effort.</p><p>Finally, research increasingly shows that rest isn't the opposite of productivity—it's an essential component. Regular breaks, adequate sleep, and time for mind-wandering all contribute to creative problem-solving and sustained performance.</p>""",
        "image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
        "category": "Lifestyle",
        "author": "Amara Okafor",
        "authorImage": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
        "readTime": "11 min read",
        "createdAt": "2023-09-05T00:00:00Z",
        "updatedAt": "2023-09-05T00:00:00Z",
      },
      {
        "_id": "7",
        "title": "The Future of E-commerce: Trends Reshaping Online Retail",
        "excerpt":
          "From augmented reality shopping to sustainable delivery, how technology and changing consumer values are transforming e-commerce.",
        "content":
          """<p>E-commerce has evolved dramatically since its inception, but the pace of innovation is only accelerating. Several key trends are converging to reshape how we shop online.</p><p>Augmented reality is bridging the gap between physical and digital retail experiences. Shoppers can now visualize furniture in their homes, try on glasses virtually, or see how makeup would look on their skin—all before making a purchase. This technology is reducing return rates and increasing purchase confidence.</p><p>Voice commerce is gaining momentum as smart speakers become household staples. Consumers are growing comfortable ordering everyday items through voice assistants, creating new opportunities for brands to optimize for audio-based discovery.</p><p>Sustainability has moved from a nice-to-have to a business imperative. From carbon-neutral shipping options to packaging innovations and transparent supply chains, eco-conscious practices are becoming expected rather than exceptional.</p><p>Perhaps most significantly, the lines between content and commerce continue to blur. Social commerce, livestream shopping, and shoppable video are creating more immersive and entertainment-driven purchasing journeys.</p><p>For businesses, success in this evolving landscape requires both technological adaptation and a deep understanding of changing consumer values and behaviors.</p>""",
        "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        "category": "Business",
        "author": "Jason Torres",
        "authorImage": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
        "readTime": "8 min read",
        "createdAt": "2023-07-30T00:00:00Z",
        "updatedAt": "2023-07-30T00:00:00Z",
      },
      {
        "_id": "8",
        "title": "The Renaissance of Film Photography in a Digital Age",
        "excerpt":
          "Why a growing number of photographers are returning to analog methods despite the convenience of digital technology.",
        "content":
          """<p>In an era where smartphone cameras offer instant gratification and digital manipulation is effortless, a countermovement is gaining momentum: the revival of film photography.</p><p>This renaissance isn't driven by nostalgia alone. Many photographers, particularly younger ones who grew up in the digital era, are discovering the unique aesthetic qualities of film—its distinctive grain, color rendition, and dynamic range that digital filters can only approximate.</p><p>The deliberate nature of film photography also offers a different creative experience. With limited exposures per roll and no immediate feedback, photographers must slow down, carefully consider each shot, and embrace the uncertainty of results. This process fosters mindfulness and intentionality that many find missing from digital workflows.</p><p>Film's physical nature is another draw. In a world where digital photos often remain trapped on hard drives or in cloud storage, film produces tangible negatives and prints—artifacts that exist in the physical world with their own material presence.</p><p>Camera manufacturers are responding to this renewed interest, with companies like Kodak and Fujifilm reintroducing discontinued film stocks and new startups creating modern takes on analog cameras.</p><p>Rather than replacing digital photography, film is finding its place alongside it—offering photographers another tool for expression and a welcome counterbalance to our increasingly screen-mediated visual culture.</p>""",
        "image": "https://images.unsplash.com/photo-1452796651103-7c07fca7a2c1",
        "category": "Photography",
        "author": "Mia Wong",
        "authorImage": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        "readTime": "6 min read",
        "createdAt": "2023-08-17T00:00:00Z",
        "updatedAt": "2023-08-17T00:00:00Z",
      },
      {
        "_id": "9",
        "title": "Mindful Consumption: Rethinking Our Relationship with Stuff",
        "excerpt":
          "How the principles of mindfulness can help us make more intentional choices about what we buy and own.",
        "content":
          """<p>Consumer culture encourages constant acquisition, but a growing movement is questioning this paradigm. Mindful consumption offers an alternative approach—one that emphasizes quality over quantity, purpose over impulse, and satisfaction over endless desire.</p><p>At its core, mindful consumption isn't about deprivation or minimalism (though it may lead there for some). Instead, it's about bringing awareness to our purchasing decisions and their broader impacts on our wellbeing, communities, and the planet.</p><p>Research suggests that material possessions beyond what meets our basic needs provide diminishing returns on happiness. Meanwhile, experiences, relationships, and purpose consistently contribute more to life satisfaction than accumulating things.</p><p>Practical approaches to more mindful consumption include implementing waiting periods before non-essential purchases, considering the full lifecycle of products, and regularly reflecting on whether our possessions are serving our values and goals.</p><p>Many who adopt these practices report not only financial benefits but also reduced stress, more physical and mental space, and a greater appreciation for what they already have.</p><p>As environmental concerns grow and more people question the work-and-spend cycle, mindful consumption offers a middle path—neither ascetic rejection of material goods nor uncritical participation in consumer culture.</p>""",
        "image": "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19",
        "category": "Lifestyle",
        "author": "Thomas Reid",
        "authorImage": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
        "readTime": "7 min read",
        "createdAt": "2023-09-21T00:00:00Z",
        "updatedAt": "2023-09-21T00:00:00Z",
      },
      {
        "_id": "10",
        "title": "The Evolution of Typography in Web Design",
        "excerpt":
          "How typography has transformed from a technical constraint to a central element of digital experiences.",
        "content":
          """<p>In the early days of the web, typography was severely limited. Designers were restricted to a handful of "web-safe" fonts and had minimal control over how text was displayed across different browsers and operating systems.</p><p>Today, typography stands at the center of web design. The introduction of web fonts, improved CSS control, and higher resolution displays has transformed how we approach text on screen.</p><p>Variable fonts represent the latest advancement, allowing a single font file to behave like multiple fonts. Designers can now adjust weight, width, slant, and other attributes along a continuous spectrum—all while keeping file sizes manageable.</p><p>Responsive typography has also become essential, with text adapting not just to different screen sizes but to different reading contexts. The best designs consider reading distance, ambient light, and user preferences.</p><p>Beyond technical considerations, there's growing recognition of typography's emotional impact. Font choices convey personality and tone, establishing brand voice before a single word is read.</p><p>As web design continues to mature, typography is increasingly recognized not just as a vehicle for content but as a fundamental design element that shapes the entire user experience.</p>""",
        "image": "https://images.unsplash.com/photo-1561070791-2526d30994b5",
        "category": "Design",
        "author": "Elena Petrova",
        "authorImage": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        "readTime": "5 min read",
        "createdAt": "2023-06-03T00:00:00Z",
        "updatedAt": "2023-06-03T00:00:00Z",
      },
      {
        "_id": "11",
        "title": "The Cognitive Benefits of Learning to Code",
        "excerpt":
          "How programming education develops problem-solving skills and computational thinking beyond the tech industry.",
        "content":
          """<p>Learning to code is often promoted as a pathway to lucrative tech jobs, but its benefits extend far beyond career opportunities. Research increasingly shows that programming education develops valuable cognitive skills applicable across disciplines.</p><p>Computational thinking—the ability to break down complex problems into logical steps—is perhaps the most transferable skill coding cultivates. This structured approach to problem-solving has applications in fields from medicine to law to the arts.</p><p>Coding also builds resilience and metacognition. The process of debugging—identifying and fixing errors—teaches persistence and helps students develop strategies for monitoring their own thinking. These skills correlate with academic and professional success broadly.</p><p>For children, early exposure to programming concepts has been linked to improvements in mathematical reasoning and spatial skills. Importantly, these benefits appear to be accessible regardless of innate aptitude—everyone can develop these cognitive frameworks through practice.</p><p>As automation transforms the workforce, the ability to think algorithmically and understand the systems that underlie modern life becomes increasingly valuable. Even for those who never write code professionally, programming literacy provides a mental toolkit for navigating an increasingly complex world.</p>""",
        "image": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
        "category": "Technology",
        "author": "Raj Patel",
        "authorImage": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        "readTime": "9 min read",
        "createdAt": "2023-08-25T00:00:00Z",
        "updatedAt": "2023-08-25T00:00:00Z",
      },
      {
        "_id": "12",
        "title": "The Slow Fashion Movement: Quality Over Quantity",
        "excerpt":
          "How consumers and designers are challenging fast fashion through mindful, sustainable approaches to clothing.",
        "content":
          """<p>Fast fashion has transformed how we dress, making trendy clothing accessible at unprecedented low prices. But this convenience comes with steep environmental and human costs that are increasingly hard to ignore.</p><p>The slow fashion movement offers an alternative vision—one centered on quality garments, ethical production, and timeless style rather than rapid trend cycles. It's not about spending more, but about buying less and choosing better.</p><p>Key principles include investing in versatile pieces that last for years rather than weeks; understanding the origins and impacts of our clothing; supporting brands with transparent supply chains and fair labor practices; and developing personal style that transcends seasonal trends.</p><p>Repair and maintenance are also central to slow fashion. Simple skills like sewing on buttons or mending small tears can extend a garment's life significantly, reducing both environmental impact and long-term cost per wear.</p><p>While individual choices matter, the movement also advocates for systemic change. This includes pushing for industry regulation, supporting innovative materials research, and challenging the cultural narratives that equate constant consumption with status and identity.</p><p>As awareness grows about fashion's true costs, slow fashion offers a path forward that balances self-expression with social and environmental responsibility.</p>""",
        "image": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f",
        "category": "Fashion",
        "author": "Isabella Martinez",
        "authorImage": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
        "readTime": "7 min read",
        "createdAt": "2023-07-07T00:00:00Z",
        "updatedAt": "2023-07-07T00:00:00Z",
      },
      {
        "_id": "13",
        "title": "The Future of Artificial Intelligence in Everyday Life",
        "excerpt":
          "Exploring how AI is seamlessly integrating into our daily routines, from smart assistants to personalized recommendations.",
        "content":
          """<p>Artificial Intelligence is no longer a futuristic concept; it's an integral part of our daily lives. From the moment we wake up to the time we go to bed, AI-powered systems are working behind the scenes to make our lives easier, more efficient, and more connected.</p><p>Smart assistants like Siri, Alexa, and Google Assistant have become commonplace, helping us manage our schedules, answer questions, and control our smart home devices. These voice-activated AI systems are constantly learning and improving, becoming more intuitive and personalized with each interaction.</p><p>Beyond our homes, AI is transforming industries suchs as healthcare, finance, and transportation. In healthcare, AI is assisting doctors in diagnosing diseases, developing new drugs, and personalizing treatment plans. In finance, AI algorithms are detecting fraud, managing investments, and providing personalized financial advice.</p><p>The future of AI promises even more profound changes. As AI continues to evolve, we can expect to see even more sophisticated applications that will further enhance our lives and reshape our world. However, it's crucial to address ethical considerations and ensure that AI is developed and used responsibly, prioritizing human well-being and societal benefit.</p>""",
        "image": "https://images.unsplash.com/photo-1507146153580-69a1fe6d8ad9",
        "category": "Technology",
        "author": "Sophia Lee",
        "authorImage": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        "readTime": "10 min read",
        "createdAt": "2023-10-01T00:00:00Z",
        "updatedAt": "2023-10-01T00:00:00Z",
      },
      {
        "_id": "14",
        "title": "The Benefits of Mindfulness Meditation for Stress Reduction",
        "excerpt":
          "Discover how practicing mindfulness can significantly reduce stress and improve overall mental well-being.",
        "content":
          """<p>In today's fast-paced world, stress has become an unwelcome companion for many. The constant demands of work, personal life, and societal pressures can take a toll on our mental and physical health. Mindfulness meditation offers a powerful and accessible tool to combat stress and cultivate inner peace.</p><p>Mindfulness is the practice of being present and fully aware of the current moment, without judgment. It involves paying attention to our thoughts, feelings, and bodily sensations as they arise, and observing them with a sense of curiosity and acceptance. Through regular practice, mindfulness can help us develop a greater sense of self-awareness and emotional regulation.</p><p>Numerous scientific studies have demonstrated the effectiveness of mindfulness meditation in reducing stress, anxiety, and depression. It has been shown to lower cortisol levels (the stress hormone), improve sleep quality, and enhance emotional resilience. By training our minds to stay in the present moment, we can break free from the cycle of rumination and worry that often fuels stress.</p>""",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "category": "Wellness",
        "author": "Dr. Emily White",
        "authorImage": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        "readTime": "8 min read",
        "createdAt": "2023-09-15T00:00:00Z",
        "updatedAt": "2023-09-15T00:00:00Z",
      },
      {
        "_id": "15",
        "title": "The Art of Storytelling in Modern Marketing",
        "excerpt":
          "How brands are using compelling narratives to connect with audiences and build lasting relationships.",
        "content":
          """<p>In a crowded marketplace, capturing the attention of consumers is more challenging than ever. Traditional advertising often falls flat, as consumers have become adept at tuning out overt sales pitches. This is where the power of storytelling comes in.</p><p>Storytelling is an ancient art form that has been used for centuries to convey messages, share experiences, and build connections. In modern marketing, brands are leveraging the power of narrative to create emotional connections with their audiences, build trust, and differentiate themselves from competitors.</p><p>A compelling brand story goes beyond simply listing product features. It tells a tale of purpose, values, and impact. It humanizes the brand, making it relatable and memorable. By weaving a narrative around their products or services, brands can create a deeper engagement with consumers, fostering loyalty and advocacy.</p><p>Effective storytelling in marketing involves understanding your audience, identifying your brand's unique narrative, and crafting a story that resonates with their emotions and aspirations. Whether through video, social media, or experiential campaigns, brands that master the art of storytelling are able to create a lasting impression and build a strong, authentic connection with their customers.</p>""",
        "image": "https://picsum.photos/seed/storytelling/1200/800",
        "category": "Marketing",
        "author": "David Green",
        "authorImage": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        "readTime": "9 min read",
        "createdAt": "2023-08-01T00:00:00Z",
        "updatedAt": "2023-08-01T00:00:00Z",
      },
    ]

    for article_data in mockArticles:
        author_name = article_data['author']
        # Generate a unique email for each author for seeding purposes
        email = f"{author_name.lower().replace(' ', '.')}.{uuid.uuid4().hex[:6]}@example.com"
        author, _ = CustomUser.objects.get_or_create(
            username=author_name,
            email=email, # Provide a unique email
            defaults={
                'first_name': author_name.split(' ')[0],
                'last_name': author_name.split(' ')[-1] if len(author_name.split(' ')) > 1 else '',
                'user_type': 'normal' # Default user type
            }
        )

        category_name = article_data['category']
        category, _ = Category.objects.get_or_create(name=category_name)

        Article.objects.create(
            id=uuid.uuid4(),
            title=article_data['title'],
            excerpt=article_data['excerpt'],
            content=article_data['content'],
            image=article_data['image'],
            category=category,
            author=author,
            readTime=article_data['readTime'],
            created_at=datetime.fromisoformat(article_data['createdAt'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(article_data['updatedAt'].replace('Z', '+00:00')),
        )
    print("Data seeded successfully!")

if __name__ == "__main__":
    seed_data()