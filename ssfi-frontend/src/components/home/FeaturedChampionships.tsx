'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Users, Flame } from 'lucide-react';
import apiClient from '@/lib/api/client';

// Championship images for the cards
const championshipImages = [
  '/images/hero/hero_national_new.jpg',
  '/images/hero/hero_speed_new.jpg',
  '/images/hero/hero_national_new.jpg',
  '/images/hero/hero_speed_new.jpg',
  '/images/hero/hero_national_new.jpg',
];

// ============================================
// CardStreamController - manages card animations (Simplified)
// ============================================
class CardStreamController {
  container: HTMLElement;
  cardLine: HTMLElement;
  position: number = 0;
  velocity: number = 60; // Consistent readable speed
  direction: number = -1; // Move left
  isAnimating: boolean = true;
  isDragging: boolean = false;
  isHovering: boolean = false;
  lastTime: number = 0;
  lastMouseX: number = 0;
  mouseVelocity: number = 0;
  friction: number = 0.95;
  minVelocity: number = 30;
  containerWidth: number = 0;
  cardLineWidth: number = 0;

  constructor(container: HTMLElement, cardLine: HTMLElement) {
    this.container = container;
    this.cardLine = cardLine;
  }

  init() {
    this.calculateDimensions();
    this.setupEventListeners();
    // Start at 0 to align with container
    this.position = 0;
    this.updateCardPosition();
    this.animate();
  }

  calculateDimensions() {
    this.containerWidth = this.container.offsetWidth;
    // Responsive card width
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 280 : 350;
    const cardGap = isMobile ? 20 : 40;
    const cardCount = this.cardLine.children.length;
    this.cardLineWidth = (cardWidth + cardGap) * cardCount;
  }

  setupEventListeners() {
    this.cardLine.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Hover pause functionality
    this.cardLine.addEventListener('mouseenter', () => this.setHovering(true));
    this.cardLine.addEventListener('mouseleave', () => this.setHovering(false));

    this.cardLine.addEventListener(
      'touchstart',
      (e) => this.startDrag(e.touches[0] as unknown as MouseEvent),
      { passive: false }
    );
    document.addEventListener('touchmove', (e) => this.onDrag(e.touches[0] as unknown as MouseEvent), {
      passive: false,
    });
    document.addEventListener('touchend', () => this.endDrag());

    this.cardLine.addEventListener('wheel', (e) => this.onWheel(e));
    // Prevent default drag behaviors
    this.cardLine.addEventListener('dragstart', (e) => e.preventDefault());

    window.addEventListener('resize', () => this.calculateDimensions());
  }

  setHovering(hovering: boolean) {
    this.isHovering = hovering;
  }

  startDrag(e: MouseEvent | Touch) {
    if ('preventDefault' in e) e.preventDefault();

    this.isDragging = true;
    this.isAnimating = false;
    this.lastMouseX = e.clientX;
    this.mouseVelocity = 0;

    const transform = window.getComputedStyle(this.cardLine).transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      this.position = matrix.m41;
    }

    this.cardLine.classList.add('championship-card-line-dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }

  onDrag(e: MouseEvent | Touch) {
    if (!this.isDragging) return;
    if ('preventDefault' in e) e.preventDefault();

    const deltaX = e.clientX - this.lastMouseX;
    this.position += deltaX;
    this.mouseVelocity = deltaX * 60;
    this.lastMouseX = e.clientX;

    this.cardLine.style.transform = 'translateX(' + this.position + 'px)';
  }

  endDrag() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.cardLine.classList.remove('championship-card-line-dragging');

    if (Math.abs(this.mouseVelocity) > this.minVelocity) {
      this.velocity = Math.abs(this.mouseVelocity);
      this.direction = this.mouseVelocity > 0 ? 1 : -1;
    } else {
      this.velocity = 60;
      this.direction = -1; // Resume playing left
    }

    this.isAnimating = true;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  animate() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Pause animation on hover
    if (this.isAnimating && !this.isDragging && !this.isHovering) {
      if (this.velocity > this.minVelocity && this.velocity !== 60) {
        // Decelerate to base speed if thrown
        this.velocity *= this.friction;
      } else {
        this.velocity = 60; // Base speed
      }

      this.position += this.velocity * this.direction * deltaTime;
      this.updateCardPosition();
    }

    requestAnimationFrame(() => this.animate());
  }

  updateCardPosition() {
    const containerWidth = this.containerWidth;
    const cardLineWidth = this.cardLineWidth;

    // Infinite loop logic
    // We assume the card line is duplicated enough (3x) to handle seamless looping
    // cardLineWidth is the full width of ONE set of cards? No, it's all children.
    // Ideally we want to wrap when one full set moves off screen.
    // For simplicity with the current 3x duplication strategy:

    // If we've scrolled too far left (negative)
    if (this.position < -cardLineWidth / 3) {
      this.position += cardLineWidth / 3;
    }
    // If we've scrolled too far right (positive)
    else if (this.position > 0) {
      this.position -= cardLineWidth / 3;
    }

    this.cardLine.style.transform = 'translateX(' + this.position + 'px)';
  }

  onWheel(e: WheelEvent) {
    // Optional: allow horizontal scrolling with wheel
    // e.preventDefault();
    // this.position -= e.deltaY;
    // this.updateCardPosition();
  }

  destroy() {
    // Cleanup handled by React
  }
}

// ============================================
// Main Component
// ============================================
const FeaturedChampionships = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardLineRef = useRef<HTMLDivElement>(null);
  const cardStreamRef = useRef<CardStreamController | null>(null);

  // State for events
  const [championships, setChampionships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get('/events', {
          params: { limit: 20, upcoming: true }
        });
        const data = response.data;

        if (data.status === 'success' && data.data) {
          const mappedEvents = data.data.events.map((event: any) => ({
            id: event.id,
            title: event.name,
            category: event.eventLevel || 'NATIONAL',
            date: new Date(event.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            venue: event.venue || 'TBA',
            participants: event.currentEntries || 0,
            entryFee: event.entryFee || 0,
            status: new Date(event.registrationEndDate) > new Date() ? 'Open for Registration' : 'Closed',
            isHot: (event.currentEntries > 100) || (new Date(event.eventDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000)
          }));
          setChampionships(mappedEvents);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // DEMO DATA - Only used if no real data
  const fallbackEvents = [
    {
      id: 'demo-1',
      title: 'National Speed Skating Championship 2026',
      category: 'NATIONAL',
      date: 'Mar 15, 2026',
      venue: 'New Delhi, India',
      participants: 450,
      entryFee: 2500,
      status: 'Open for Registration',
      isHot: true
    },
    {
      id: 'demo-2',
      title: 'State Level Roller Hockey Tournament',
      category: 'STATE',
      date: 'Apr 02, 2026',
      venue: 'Mumbai, Maharashtra',
      participants: 120,
      entryFee: 1500,
      status: 'Open for Registration',
      isHot: false
    },
    {
      id: 'demo-3',
      title: 'District School Games',
      category: 'DISTRICT',
      date: 'Feb 28, 2026',
      venue: 'Pune, Maharashtra',
      participants: 300,
      entryFee: 500,
      status: 'Open for Registration',
      isHot: true
    },
  ];

  const displayCards = loading ? [] : (championships.length > 0 ? championships : fallbackEvents);
  // Triplicate for infinite scroll illusion
  const allCards = displayCards.length > 0 ? [...displayCards, ...displayCards, ...displayCards] : [];

  useEffect(() => {
    if (!containerRef.current || !cardLineRef.current) return;

    cardStreamRef.current = new CardStreamController(containerRef.current, cardLineRef.current);
    cardStreamRef.current.init();

    return () => {
      cardStreamRef.current?.destroy();
    };
  }, [loading, displayCards]); // Re-init when data loads

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'NATIONAL':
        return 'from-red-500 to-orange-500';
      case 'STATE':
        return 'from-blue-500 to-cyan-500';
      case 'DISTRICT':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <section className="relative py-24 bg-dark-900 overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900" />
      <div className="absolute inset-0 opacity-5 bg-[url('/patterns/grid.svg')] bg-center" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-12">
        <div className="flex items-end justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-semibold mb-4 border border-primary-500/20 font-body">
              Upcoming Events
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-4">
              Featured Championships
            </h2>
            <p className="text-xl font-body font-light text-gray-400 max-w-2xl">
              Register for upcoming skating events and championships across India
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="hidden md:block"
          >
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold transition-all duration-300 font-body"
            >
              View All Events
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Card Stream Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden h-[460px]">
        {/* Stream Line */}
        <div
          ref={cardLineRef}
          className="absolute top-0 left-0 flex items-start gap-10 pl-4 will-change-transform"
          style={{ width: 'max-content' }}
        >
          {allCards.map((championship, index) => {
            const imageIndex = index % championshipImages.length;

            return (
              <Link
                href={`/events/${championship.id}`}
                key={`${championship.id}-${index}`}
                className="block group"
              >
                <div className="w-[280px] md:w-[350px] h-[440px] bg-dark-800 rounded-xl overflow-hidden border border-white/5 transition-all duration-300 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 flex flex-col">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={championshipImages[imageIndex]}
                      alt={championship.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)';
                        }
                      }}
                    />

                    {/* Hot Badge */}
                    {championship.isHot && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3 fill-white" />
                          <span>HOT EVENT</span>
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className={'px-3 py-1 rounded-full bg-gradient-to-r ' + getCategoryColor(championship.category) + ' text-white text-xs font-bold shadow-lg'}>
                        {championship.category}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {!championship.isHot && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
                          {championship.status}
                        </div>
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60" />
                  </div>

                  {/* Details Section */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-white font-headline font-bold text-lg mb-4 line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">
                      {championship.title}
                    </h3>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-2 text-gray-400 text-sm font-body">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        <span>{championship.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm font-body">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <span className="line-clamp-1">{championship.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm font-body">
                        <Users className="w-4 h-4 text-primary-500" />
                        <span>{championship.participants} Participants</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                      <div>
                        <p className="text-xs text-gray-500">Entry Fee</p>
                        <p className="text-xl font-bold text-white">₹{championship.entryFee}</p>
                      </div>
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 group-hover:bg-primary-500 text-white text-sm font-semibold transition-all duration-300"
                      >
                        Register
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Gradients to mask edges */}
        <div className="absolute top-0 left-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-dark-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-dark-900 to-transparent z-10 pointer-events-none" />
      </div>

      {/* Mobile View All Button */}
      <div className="container mx-auto px-4 mt-8 md:hidden text-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all duration-300"
        >
          View All Events
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedChampionships;
