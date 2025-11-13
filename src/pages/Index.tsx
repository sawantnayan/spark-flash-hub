import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Computer, Calendar, AlertCircle, Clock, Users, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Computer className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Computer Lab Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your computer lab operations with intelligent booking, inventory tracking, and maintenance management
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="shadow-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card shadow-card hover:shadow-lg transition-all">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <Computer className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Computer Inventory</h3>
            <p className="text-muted-foreground">
              Track all lab computers with detailed hardware specs, software licenses, and warranty information
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-card hover:shadow-lg transition-all">
            <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Booking</h3>
            <p className="text-muted-foreground">
              Easy-to-use booking system with calendar view, conflict detection, and automated confirmations
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-card hover:shadow-lg transition-all">
            <div className="p-3 rounded-lg bg-warning/10 w-fit mb-4">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Issue Tracking</h3>
            <p className="text-muted-foreground">
              Report and track hardware/software issues with priority levels and resolution workflows
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-card hover:shadow-lg transition-all">
            <div className="p-3 rounded-lg bg-success/10 w-fit mb-4">
              <Clock className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
            <p className="text-muted-foreground">
              Track session logs, generate reports, and analyze lab utilization patterns
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-card hover:shadow-lg transition-all">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">User Management</h3>
            <p className="text-muted-foreground">
              Role-based access control for admins, lab staff, and students with detailed profiles
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card shadow-card hover:shadow-lg transition-all">
            <div className="p-3 rounded-lg bg-destructive/10 w-fit mb-4">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-muted-foreground">
              Built with security best practices, row-level security, and authenticated access
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your lab?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Join us today and experience efficient lab management
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="shadow-lg">
            Start Managing Your Lab
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
