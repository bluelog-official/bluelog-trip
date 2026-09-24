import AdSenseUnit from "./AdSenseUnit";

export function AdSensePlaceholder({ type = "display" }) {
  return <AdSenseUnit slotId={type} format="auto" />;
}

export default AdSensePlaceholder;
