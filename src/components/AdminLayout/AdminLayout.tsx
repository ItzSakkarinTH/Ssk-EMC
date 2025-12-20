import '../../styles/admin-theme.css';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    return (
        <div className="admin-page">
            <div className="admin-container">
                {title && <h1 className="admin-title">{title}</h1>}
                {subtitle && <p className="admin-text-muted">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
}
