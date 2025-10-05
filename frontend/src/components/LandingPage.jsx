import React, { useState, useEffect, Suspense } from 'react';
import { 
  Phone, 
  Headphones, 
  Calendar, 
  Users, 
  MessageCircle, 
  Clock, 
  Zap, 
  Building, 
  Hotel, 
  Heart, 
  ShoppingCart, 
  CreditCard, 
  ArrowRight, 
  Check, 
  Mail, 
  MapPin, 
  Globe, 
  ChevronDown
} from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  heroData, 
  aboutData, 
  whyLumaaData, 
  howItWorksData, 
  industriesData, 
  testimonialsData, 
  pricingData, 
  contactData,
  formSubmission 
} from '../data/mock';

// Icon mapping
const iconMap = {
  Phone: Phone,
  Headphones: Headphones,
  Calendar: Calendar,
  Users: Users,
  MessageCircle: MessageCircle,
  Clock: Clock,
  Zap: Zap,
  Building: Building,
  Hotel: Hotel,
  Heart: Heart,
  ShoppingCart: ShoppingCart,
  CreditCard: CreditCard
};

const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [splineLoaded, setSplineLoaded] = useState(false);

  // Lazy load Spline after page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplineLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', company: '', phone: '', message: '' });
      
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 1500);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dark-container">
      {/* Header */}
      <header className="dark-header">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-brand-primary">Lumaa AI</h2>
        </div>
        <nav className="dark-nav hidden md:flex">
          <button 
            onClick={() => scrollToSection('about')} 
            className="dark-nav-link"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('features')} 
            className="dark-nav-link"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('industries')} 
            className="dark-nav-link"
          >
            Industries
          </button>
          <button 
            onClick={() => scrollToSection('pricing')} 
            className="dark-nav-link"
          >
            Pricing
          </button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className="dark-nav-link"
          >
            Contact
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="dark-full-container">
          <div className="dark-content-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-60 items-center">
              {/* Left Content */}
              <div className="space-y-40">
                <div>
                  <h1 className="display-huge mb-6">{heroData.headline}</h1>
                  <p className="body-large mb-40">{heroData.subtext}</p>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Button 
                      className="btn-primary"
                      onClick={() => scrollToSection('contact')}
                    >
                      {heroData.primaryCTA}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      className="btn-secondary"
                      onClick={() => scrollToSection('features')}
                    >
                      {heroData.secondaryCTA}
                      <ChevronDown className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right - Spline 3D Animation */}
              <div className="flex justify-center">
                <div className="w-[700px] h-[700px] overflow-visible relative">
                  {splineLoaded && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-brand-primary text-center">
                        <div className="w-32 h-32 border-2 border-brand-primary rounded-full animate-pulse mb-4 mx-auto"></div>
                        <p className="body-medium">Loading 3D Experience...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="pad-xxlarge">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large mb-6">{aboutData.title}</h2>
            <p className="body-large max-w-4xl mx-auto">{aboutData.description}</p>
          </div>
          
          <div className="dark-grid">
            {aboutData.services.map((service, index) => {
              const IconComponent = iconMap[service.icon];
              return (
                <Card key={index} className="bg-bg-secondary border-border-subtle p-40 text-center dark-transition dark-hover">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-brand-hover rounded-lg flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-brand-primary" />
                    </div>
                  </div>
                  <h3 className="heading-3 mb-4">{service.title}</h3>
                  <p className="body-medium">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Lumaa AI Section */}
      <section id="features" className="pad-xxlarge bg-bg-secondary">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large mb-6">{whyLumaaData.title}</h2>
          </div>
          
          <div className="dark-grid">
            {whyLumaaData.features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon];
              return (
                <Card key={index} className="bg-bg-primary border-border-subtle p-40 text-center dark-transition dark-hover">
                  <div className="flex justify-center mb-6">
                    <IconComponent className="h-12 w-12 text-brand-primary" />
                  </div>
                  <h3 className="heading-2 mb-4">{feature.title}</h3>
                  <p className="body-medium">{feature.description}</p>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-60">
            <Button className="btn-primary">
              {whyLumaaData.subtitle}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="pad-xxlarge">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large mb-6">{howItWorksData.title}</h2>
            <p className="heading-2 text-brand-primary">{howItWorksData.subtitle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-40">
            {howItWorksData.steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-brand-primary text-black rounded-lg flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="heading-3 mb-4">{step.title}</h3>
                <p className="body-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="pad-xxlarge bg-bg-secondary">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large">{industriesData.title}</h2>
          </div>
          
          <div className="dark-grid">
            {industriesData.sectors.map((sector, index) => {
              const IconComponent = iconMap[sector.icon];
              return (
                <Card key={index} className="bg-bg-primary border-border-subtle p-40 dark-transition dark-hover">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-hover rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="heading-3 mb-2">{sector.title}</h3>
                      <p className="body-medium">{sector.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="pad-xxlarge">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large mb-6">{testimonialsData.title}</h2>
            <p className="body-large max-w-3xl mx-auto">{testimonialsData.vision}</p>
          </div>
          
          <div className="dark-grid">
            {testimonialsData.testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-bg-secondary border-border-subtle p-40 dark-transition dark-hover">
                <blockquote className="body-medium mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="heading-3 text-brand-primary">{testimonial.author}</div>
                  <div className="body-small text-text-muted">{testimonial.role}</div>
                  <div className="body-small text-text-muted">{testimonial.company}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pad-xxlarge bg-bg-secondary">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large">{pricingData.title}</h2>
          </div>
          
          <div className="dark-grid">
            {pricingData.plans.map((plan, index) => (
              <Card key={index} className={`bg-bg-primary border-border-subtle p-40 dark-transition dark-hover relative ${
                plan.popular ? 'ring-2 ring-brand-primary' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-primary text-black px-4 py-2 text-sm font-bold">
                      POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="heading-2 mb-2">{plan.name}</h3>
                  <div className="body-large text-brand-primary mb-1">{plan.setup} setup</div>
                  <div className="heading-3">{plan.rate}</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center body-medium">
                      <Check className="h-5 w-5 text-brand-primary mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}
                  onClick={() => scrollToSection('contact')}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="pad-xxlarge">
        <div className="dark-content-container">
          <div className="text-center mb-60">
            <h2 className="display-large mb-6">{contactData.title}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-60">
            {/* Contact Form */}
            <Card className="bg-bg-secondary border-border-subtle p-40">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="body-medium mb-2 block">Name *</label>
                    <Input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="bg-bg-primary border-border-medium text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="body-medium mb-2 block">Email *</label>
                    <Input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-bg-primary border-border-medium text-text-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="body-medium mb-2 block">Company</label>
                    <Input 
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="bg-bg-primary border-border-medium text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="body-medium mb-2 block">Phone</label>
                    <Input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-bg-primary border-border-medium text-text-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="body-medium mb-2 block">Message</label>
                  <Textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="bg-bg-primary border-border-medium text-text-primary"
                    placeholder="Tell us about your business needs..."
                  />
                </div>
                
                {submitStatus && (
                  <div className={`p-4 rounded ${submitStatus === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                    {submitStatus === 'success' ? formSubmission.success : formSubmission.error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? 'Sending...' : contactData.cta}
                  {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </Card>
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="heading-2 mb-6">Get in Touch</h3>
                <p className="body-large mb-8">Ready to transform your business communication? Let's discuss how Lumaa AI can help.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <MapPin className="h-6 w-6 text-brand-primary" />
                  <span className="body-medium">{contactData.contact.address}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="h-6 w-6 text-brand-primary" />
                  <span className="body-medium">{contactData.contact.email}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Globe className="h-6 w-6 text-brand-primary" />
                  <span className="body-medium">{contactData.contact.website}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="h-6 w-6 text-brand-primary" />
                  <span className="body-medium">{contactData.contact.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-primary border-t border-border-subtle pad-large">
        <div className="dark-content-container">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-brand-primary mb-2">Lumaa AI</h3>
              <p className="body-muted">Intelligent conversations for intelligent businesses.</p>
            </div>
            <div className="text-sm text-text-muted">
              © 2024 Lumaa AI. All rights reserved. | Privacy Policy | Terms of Service
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;