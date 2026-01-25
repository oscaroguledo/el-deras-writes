import { useState } from 'react';
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
  return <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
      <div>
        <input 
          type="text" 
          placeholder="Your name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 transition-colors duration-200" 
          required 
        />
      </div>
      <div>
        <input 
          type="email" 
          placeholder="Your email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 transition-colors duration-200" 
          required 
        />
      </div>
      <div>
        <textarea 
          placeholder="Your message" 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 resize-none transition-colors duration-200" 
          rows={3} 
          required 
        />
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        ) : (
          <>
            Send Feedback <SendIcon className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
    </form>;
}