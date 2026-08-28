import React, { useState } from "react";

type SellerReviewProps = {
  productName?: string;
  onBack?: () => void;
  onConfirmed?: () => void;
};

export default function SellerReview({
  productName = "Printed Cotton Kurti",
  onBack,
  onConfirmed,
}: SellerReviewProps) {
  const [title, setTitle] = useState("Blue Cotton Printed Cotton Kurti");
  const [description, setDescription] = useState(
    "Upgrade your wardrobe with this printed cotton kurti. Made from quality cotton fabric in blue, this product is comfortable and suitable for everyday use."
  );
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirmed?.();
  };

  if (confirmed) {
    return (
      <div className="review-page">
        <div className="success-card">
          <div className="success-icon">✓</div>

          <h2>Product Ready</h2>

          <p>
            Your product has been reviewed and confirmed successfully.
          </p>

          <div className="status-badge success">
            Ready for Marketplace
          </div>

          <button className="primary-button" onClick={onBack}>
            Back to Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-header">
        <div>
          <div className="eyebrow">SELLER REVIEW</div>
          <h1>Review Listing</h1>
          <p>
            Review your AI-generated marketplace content before confirming.
          </p>
        </div>

        <div className="status-badge warning">Review Required</div>
      </div>

      <div className="review-card">
        <div className="product-summary">
          <div className="product-avatar">
            {productName.charAt(0)}
          </div>

          <div>
            <strong>{productName}</strong>
            <span>Meesho Marketplace</span>
          </div>
        </div>

        <div className="field">
          <label>Product Title</label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Description</label>

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="review-info">
          <span>✓ AI content generated</span>
          <span>✓ Marketplace selected: Meesho</span>
          <span>✓ Seller review completed</span>
        </div>

        <div className="review-actions">
          <button className="secondary-button" onClick={onBack}>
            Back
          </button>

          <button className="primary-button" onClick={handleConfirm}>
            Confirm & Mark Ready
          </button>
        </div>
      </div>
    </div>
  );
}