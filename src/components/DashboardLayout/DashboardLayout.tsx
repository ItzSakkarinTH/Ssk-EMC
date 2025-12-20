import '../../styles/dashboard-theme.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    return (
        <div className="dash-page">
            <div className="dash-container">
                {title && <h1 className="dash-title">{title}</h1>}
                {subtitle && <p className="dash-text-muted">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
}
