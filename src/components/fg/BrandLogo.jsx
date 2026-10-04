import { Image } from "@/components/ui/image";

const EMBLEM_URL =
  "https://media.base44.com/images/public/6aa2ecca7110e8b5faae6a4b/8474eed90_LOGOVANG10x.png";

export default function BrandLogo({ size = 40, variant = "dark", subtitle = true }) {
  const textColor = variant === "light" ? "#FFFFFF" : "#26275D";
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0" style={{ width: size, height: size }}>
        <Image
          src={EMBLEM_URL}
          alt="Logo Trường Việt Anh"
          className="w-full h-full"
          fittingType="fit"
        />
      </div>
      <div className="leading-tight">
        {subtitle && (
          <div className="font-extrabold tracking-tight" style={{ color: textColor, fontSize: size * 0.42 }}>
            Trường Việt Anh
          </div>
        )}
        <div className="font-medium" style={{ color: variant === "light" ? "rgba(255,255,255,0.7)" : "#6B6E8F", fontSize: size * 0.26 }}>
          FITNESS GRAM
        </div>
      </div>
    </div>
  );
}