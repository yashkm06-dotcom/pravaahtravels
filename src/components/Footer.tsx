import { ArrowRight, Check, Compass, Mail, MapPin, Phone, Send, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, packageId?: string | null) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const footerGallery = [
    'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=240&q=80',
    'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=240&q=80',
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=240&q=80',
    'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=240&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=240&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=240&q=80',
  ];

  return (
    <footer className="relative bg-[#081E2A] pt-28 text-white" id="main-footer">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-16 lg:grid-cols-[1.1fr_0.7fr_0.9fr_1fr]">
          <div className="space-y-7">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="group flex cursor-pointer items-center gap-3"
              id="footer-logo"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4DA528] text-white transition group-hover:bg-[#FF970D]">
                <Compass className="h-7 w-7" />
              </span>
              <span className="text-left">
                <span className="block text-2xl font-extrabold leading-none">Pravaah</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#4DA528]">Travels</span>
              </span>
            </button>
            <p className="max-w-sm text-[15px] font-light leading-8 text-white/70">
              Premium Himalayan journeys, slow travel, sacred valleys, adventure routes, and tailor-made comfort handled by local curators.
            </p>
            <ul className="space-y-4 text-[15px] text-white/78">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#4DA528]" />
                <a href="mailto:pravaahtravels@gmail.com" className="transition hover:text-[#FF970D]">pravaahtravels@gmail.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#4DA528]" />
                <a href="tel:+919123136692" className="transition hover:text-[#FF970D]">+91 91231 36692</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#4DA528]" />
                <span>402, Signature Towers, Sector 30, Gurugram, HR - 122001, India</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-8 text-[20px] font-bold">Services Req</h5>
            <ul className="space-y-4 text-[15px] text-white/70">
              {[
                ['About Us', 'about'],
                ['Gallery', 'gallery'],
                ['Packages', 'packages'],
                ['Contact', 'contact'],
                ['Customer Portal', 'portal'],
              ].map(([label, view]) => (
                <li key={view}>
                  <button onClick={() => onNavigate(view)} className="group flex cursor-pointer items-center gap-2 transition hover:text-[#4DA528]">
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-8 text-[20px] font-bold">Gallery</h5>
            <div className="grid grid-cols-3 gap-3">
              {footerGallery.map((src, idx) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => onNavigate('gallery')}
                  className="group aspect-square cursor-pointer overflow-hidden rounded-md bg-white/10"
                >
                  <img
                    src={src}
                    alt={`Travel gallery ${idx + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-8 text-[20px] font-bold">Newsletter</h5>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-5"
            >
              <div className="flex overflow-hidden rounded-md bg-white">
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  className="min-w-0 flex-1 px-5 py-4 text-sm font-medium text-stone-900 outline-none"
                />
                <button type="submit" className="flex w-14 items-center justify-center bg-[#4DA528] text-white transition hover:bg-[#FF970D]">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-white/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4DA528] text-white">
                  <Check className="h-3 w-3" />
                </span>
                <p>I agree to all your terms and policies</p>
              </div>
            </form>
            <ul className="mt-8 flex gap-3">
              {['f', 'x', 'in', 'ig'].map((item) => (
                <li key={item}>
                  <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[12px] font-bold uppercase text-white/70 transition hover:border-[#4DA528] hover:bg-[#4DA528] hover:text-white">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 py-8 text-[14px] text-white/62 md:flex-row">
          <p>Copyright © {currentYear} by <span className="text-[#4DA528]">Pravaah Travels.</span> All Rights Reserved</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <button onClick={() => onNavigate('admin-login')} className="flex cursor-pointer items-center gap-2 transition hover:text-[#4DA528]">
              <Shield className="h-4 w-4" />
              <span>Admin Gateway</span>
            </button>
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
