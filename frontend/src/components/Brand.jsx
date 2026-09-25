export const APP_NAME = "Household Management";

export default function Brand({ className = "brand" }) {
  return (
    <div className={className}>
      <div className="brand-logo" aria-hidden="true">🏡</div>
      <div className="brand-name">{APP_NAME}</div>
    </div>
  );
}
