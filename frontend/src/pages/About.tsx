import React from 'react';
import { Link } from 'react-router-dom';
export default function About() {
  return <div className="py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-6">
          About El_Dera's writes
        </h1>
        <div className="prose prose-lg max-w-none text-justify">
          <p>
            Founded in 2020, El_Dera's writes is a platform dedicated to
            exploring the intersection of technology, design, and mindful
            living. Our mission is to provide thoughtful, well-researched
            content that inspires, educates, and challenges our readers.
          </p>
          <h2>Our Story</h2>
          <p>
            El_Dera's writes began as a personal blog by Dera Elijah, a software
            engineer and design enthusiast with a passion for sharing knowledge.
            What started as a small collection of articles has grown into a
            community of like-minded individuals who value depth, nuance, and
            authenticity in digital content.
          </p>
          <h2>Our Team</h2>
          <p>
            Today, El_Dera's writes is powered by a small but dedicated team of
            writers, editors, and designers who share a commitment to quality.
            We come from diverse backgrounds but are united by our belief in the
            power of well-crafted words and thoughtful design.
          </p>
          <h2>Our Approach</h2>
          <p>
            We believe that the best content emerges from a combination of
            expertise, research, and genuine curiosity. Each article published
            on El_Dera's writes undergoes a thorough editorial process to ensure
            accuracy, relevance, and readability.
          </p>
          <p>We're committed to:</p>
          <ul>
            <li>Producing original, thoughtful content</li>
            <li>Maintaining editorial independence</li>
            <li>Respecting our readers' time and intelligence</li>
            <li>Fostering constructive dialogue through our comment section</li>
            <li>
              Continuously improving our platform based on reader feedback
            </li>
          </ul>
          <h2>Connect With Us</h2>
          <p>
            We love hearing from our readers! Whether you have a question,
            suggestion, or just want to say hello, don't hesitate to{' '}
            <Link to="/contact" className="text-gray-900 underline">
              get in touch
            </Link>
            .
          </p>
        </div>
      </div>
    </div>;
}