import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  category: 'analytics' | 'ml' | 'simulator' | 'info';
  description: string;
  onNavigate: (path: string) => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  category,
  description,
  onNavigate,
}) => {
  const getCategoryBadge = () => {
    switch (category) {
      case 'ml':
        return <span className="badge badge-ml"><Sparkles size={12} /> ML Feature Ready</span>;
      case 'simulator':
        return <span className="badge badge-sim">Simulator Engine Ready</span>;
      case 'analytics':
        return <span className="badge badge-analytics">Analytics Endpoint Ready</span>;
      default:
        return <span className="badge">IPLytics Module</span>;
    }
  };

  return (
    <div className="placeholder-container">
      <div className="placeholder-card">
        <div className="placeholder-badge-wrapper">{getCategoryBadge()}</div>
        <h2>{title}</h2>
        <p className="placeholder-description">{description}</p>
        <div className="placeholder-info-box">
          <p>
            The backend endpoints for this feature are fully operational on <code>http://localhost:8000</code>.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('/')}>
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
