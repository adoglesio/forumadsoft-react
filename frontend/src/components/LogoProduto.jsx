import logoSIAFW         from "../assets/SIAFW.png";
import logoSiafEvolution from "../assets/siafEvolution.png";
import logoGOL           from "../assets/GOL.png";
import logoAdchef        from "../assets/adchef.png";

const LOGOS = {
  SIAFW:          logoSIAFW,
  siafEvolution:  logoSiafEvolution,
  GOL:            logoGOL,
  adchef:         logoAdchef,
};

/**
 * Exibe o logo do produto ou um badge colorido como fallback.
 * size: "sm" (20px badge), "md" (28px), "lg" (48px)
 */
export default function LogoProduto({ icone, nome, cor, size = "md", style = {} }) {
  const logo = LOGOS[icone];

  const sizes = {
    sm: { height: 16, maxWidth: 64 },
    md: { height: 28, maxWidth: 80 },
    lg: { height: 40, maxWidth: 120 },
    xl: { height: 52, maxWidth: 160 },
  };

  const dim = sizes[size] || sizes.md;

  if (logo) {
    return (
      <img
        src={logo}
        alt={nome}
        title={nome}
        style={{
          height: dim.height,
          maxWidth: dim.maxWidth,
          objectFit: "contain",
          display: "inline-block",
          verticalAlign: "middle",
          ...style,
        }}
      />
    );
  }

  // Fallback: badge colorido com nome
  return (
    <span style={{
      background: cor || "#0A5C8E",
      color: "white",
      fontSize: dim.height * 0.45,
      padding: `2px ${dim.height * 0.4}px`,
      borderRadius: 20,
      fontWeight: 700,
      display: "inline-block",
      verticalAlign: "middle",
      ...style,
    }}>
      {nome}
    </span>
  );
}