import React from 'react';

export interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

export const FooterColumn: React.FC<FooterColumnProps> = ({ title, links }) => {
  return (
    <div className="flex flex-col gap-4 text-left">
      <h4 className="font-bold text-[#111111] text-base tracking-tight">{title}</h4>
      <ul className="flex flex-col gap-3 p-0 m-0 list-none">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-[#6B7280] hover:text-[#1F6B47] transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
