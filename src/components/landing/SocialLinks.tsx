import React from 'react';

export const SocialLinks: React.FC = () => {
  const socials = [
    { name: 'LinkedIn', href: '#linkedin' },
    { name: 'Instagram', href: '#instagram' },
    { name: 'X (Twitter)', href: '#twitter' },
    { name: 'GitHub', href: '#github' },
  ];

  return (
    <div className="flex items-center gap-6">
      {socials.map((social) => (
        <a
          key={social.name}
          href={social.href}
          className="text-sm font-medium text-[#6B7280] hover:text-[#1F6B47] transition-colors"
          aria-label={social.name}
        >
          {social.name}
        </a>
      ))}
    </div>
  );
};
