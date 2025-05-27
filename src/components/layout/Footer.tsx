import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useTranslations } from '../../hooks/useTranslations';
import { hexToRgba } from '../../utils/colorUtils';

const Footer: React.FC = () => {
  // Use React Router's navigation hook
  const navigate = useNavigate();
  const { config } = useConfiguration();
  const { commonTranslate, navTranslate } = useTranslations();

  return (
    <footer
      className="w-full mt-auto relative overflow-hidden"
      style={{
        background: config.darkMode
          ? `linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)`
          : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)`,
        backdropFilter: 'blur(10px)',
        borderTop: config.darkMode
          ? `1px solid ${hexToRgba('#64748b', 0.3)}`
          : `1px solid ${hexToRgba('#cbd5e1', 0.5)}`
      }}
    >
      {/* Animated accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] animate-pulse"
        style={{
          background: config.darkMode
            ? `linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)`
            : `linear-gradient(90deg, transparent 0%, #6366f1 50%, transparent 100%)`
        }}
      ></div>

      <div className="container mx-auto px-3 py-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Brand Section */}
          <div className="space-y-2 text-center md:text-left">
            <h3 className={`text-base md:text-lg font-bold ${
              config.darkMode
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400'
                : 'text-gray-800'
            }`}>
              {config.companyName}
            </h3>
            <p className={`text-xs md:text-sm font-light leading-relaxed ${
              config.darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {commonTranslate('platformDescription', 'Engaging educational platform for interactive learning experiences.')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 text-center md:text-left">
            <h3 className={`text-sm md:text-base font-semibold ${
              config.darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              {navTranslate('quickLinks')}
            </h3>
            <ul className="space-y-1">
              {[
                { text: navTranslate('home'), path: '/' },
                { text: navTranslate('assignments'), path: '/manage-assignments' },
                { text: navTranslate('certificates'), path: '/certificates' }
              ].map((link) => (
                <li key={link.text}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-xs md:text-sm transition-all duration-300 flex items-center justify-center md:justify-start group cursor-pointer ${
                      config.darkMode
                        ? 'text-gray-300 hover:text-blue-400'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    <span className={`w-0 group-hover:w-2 h-[1px] transition-all duration-300 mr-2 ${
                      config.darkMode ? 'bg-blue-400' : 'bg-indigo-600'
                    }`}></span>
                    {link.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-2 text-center md:text-left">
            <h3 className={`text-sm md:text-base font-semibold ${
              config.darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              {navTranslate('support')}
            </h3>
            <ul className="space-y-1">
              {[
                { text: navTranslate('help'), path: '/help' },
                { text: navTranslate('privacy'), path: '/privacy' },
                { text: navTranslate('terms'), path: '/terms' }
              ].map((item) => (
                <li key={item.text}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`text-xs md:text-sm transition-all duration-300 flex items-center justify-center md:justify-start group cursor-pointer ${
                      config.darkMode
                        ? 'text-gray-300 hover:text-blue-400'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    <span className={`w-0 group-hover:w-2 h-[1px] transition-all duration-300 mr-2 ${
                      config.darkMode ? 'bg-blue-400' : 'bg-indigo-600'
                    }`}></span>
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`mt-4 pt-3 flex flex-col md:flex-row justify-between items-center relative ${
          config.darkMode
            ? 'border-t border-gray-600/30'
            : 'border-t border-gray-300/50'
        }`}>
          <p className={`text-xs md:text-sm text-center md:text-left mb-2 md:mb-0 font-light ${
            config.darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {config.footerText}
          </p>

          {/* Social Links */}
          <div className="flex space-x-3">
            {[
              {
                name: 'Facebook',
                url: 'https://facebook.com',
                path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
              },
              {
                name: 'Twitter',
                url: 'https://twitter.com',
                path: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84'
              },
              {
                name: 'Instagram',
                url: 'https://instagram.com',
                path: 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z'
              }
            ].map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors duration-300 transform hover:scale-110 ${
                  config.darkMode
                    ? 'text-gray-400 hover:text-blue-400'
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
                aria-label={social.name}
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d={social.path} clipRule="evenodd" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle decorative elements */}
      <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full blur-2xl ${
        config.darkMode ? 'bg-blue-500/5' : 'bg-indigo-500/5'
      }`}></div>
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl ${
        config.darkMode ? 'bg-indigo-500/5' : 'bg-blue-500/5'
      }`}></div>
    </footer>
  );
};

export default Footer;
