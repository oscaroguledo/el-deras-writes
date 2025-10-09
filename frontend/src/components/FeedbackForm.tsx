import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { SendIcon } from 'lucide-react';
import { submitFeedback } from '../utils/api';
export function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setIsSubmitting(true);
      await submitFeedback({
        name,
        email,
        message
      });
      toast.success('Thank you for your feedback!');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
      </div>
      <div>
        <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
      </div>
      <div>
        <textarea placeholder="Your message" value={message} onChange={e => setMessage(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" rows={3} required />
      </div>
      <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
        {isSubmitting ? 'Sending...' : <>
            Send Feedback <SendIcon className="ml-2 h-4 w-4" />
          </>}
      </button>
    </form>;
}