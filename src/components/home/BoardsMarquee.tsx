const boards = [
  'CBSE',
  'ICSE',
  'ISC',
  'IB',
  'Cambridge IGCSE',
  'Cambridge A-Level',
  'Maharashtra Board',
  'Karnataka Board',
  'Tamil Nadu Board',
  'Kerala Board',
  'Gujarat Board',
  'Rajasthan Board',
  'UP Board',
  'Bihar Board',
  'West Bengal Board',
  'NIOS',
];

export function BoardsMarquee() {
  return (
    <section className="py-12 overflow-hidden bg-card/30 border-y border-border/50">
      <div className="container mx-auto px-4 mb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Trusted by students from
        </p>
      </div>
      
      <div className="relative">
        {/* Gradient masks for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* First row - scrolling left */}
        <div className="flex animate-marquee whitespace-nowrap">
          {[...boards, ...boards].map((board, index) => (
            <div
              key={`${board}-${index}`}
              className="mx-6 flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-primary/30" />
              <span className="text-lg font-semibold text-muted-foreground/80 hover:text-foreground transition-colors">
                {board}
              </span>
            </div>
          ))}
        </div>
        
        {/* Second row - scrolling right (reverse) */}
        <div className="flex animate-marquee-reverse whitespace-nowrap mt-4">
          {[...boards.slice().reverse(), ...boards.slice().reverse()].map((board, index) => (
            <div
              key={`reverse-${board}-${index}`}
              className="mx-6 flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-accent/30" />
              <span className="text-lg font-semibold text-muted-foreground/60 hover:text-foreground transition-colors">
                {board}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
