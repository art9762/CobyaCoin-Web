"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-22
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("handle", sa.String(64), nullable=False, unique=True),
        sa.Column("display_name", sa.String(128), nullable=False, server_default=""),
        sa.Column("avatar_url", sa.String(512), nullable=False, server_default=""),
        sa.Column("email", sa.String(256), nullable=True),
        sa.Column("telegram_id", sa.Integer, nullable=True, unique=True),
        sa.Column("google_sub", sa.String(128), nullable=True, unique=True),
        sa.Column("apple_sub", sa.String(128), nullable=True, unique=True),
        sa.Column("is_admin", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("is_banned", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("ban_reason", sa.String(256), nullable=False, server_default=""),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("trades_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("referral_code", sa.String(32), nullable=False, unique=True),
    )
    op.create_index("ix_users_handle", "users", ["handle"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "balances",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("cbc", sa.Float, nullable=False, server_default="0"),
        sa.Column("mpl", sa.Float, nullable=False, server_default="0"),
        sa.Column("frozen_cbc", sa.Float, nullable=False, server_default="0"),
        sa.Column("frozen_mpl", sa.Float, nullable=False, server_default="0"),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("side", sa.String(8), nullable=False),
        sa.Column("cbc", sa.Float, nullable=False),
        sa.Column("mpl", sa.Float, nullable=False),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("filled_cbc", sa.Float, nullable=False, server_default="0"),
        sa.Column("status", sa.String(16), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_orders_status_side_price", "orders", ["status", "side", "price"])

    op.create_table(
        "trades",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("buyer_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("seller_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("cbc", sa.Float, nullable=False),
        sa.Column("mpl", sa.Float, nullable=False),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("counterparty", sa.String(32), nullable=False, server_default="p2p"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    op.create_table(
        "market_state",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("price", sa.Float, nullable=False, server_default="104.28"),
        sa.Column("prev_price", sa.Float, nullable=False, server_default="104.28"),
        sa.Column("reserve_liq_mpl", sa.Float, nullable=False, server_default="412000"),
        sa.Column("reserve_liq_cbc", sa.Float, nullable=False, server_default="2904"),
        sa.Column("circuit_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("circuit_dir", sa.String(4), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "price_ticks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    op.create_table(
        "mining_farms",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("gpus", sa.Integer, nullable=False, server_default="2"),
        sa.Column("max_gpus", sa.Integer, nullable=False, server_default="10"),
        sa.Column("pending", sa.Float, nullable=False, server_default="0"),
        sa.Column("rate", sa.Float, nullable=False, server_default="0.0032"),
        sa.Column("last_tick", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "auction_lots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("creator_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(128), nullable=False),
        sa.Column("description", sa.String(512), nullable=False, server_default=""),
        sa.Column("rarity", sa.String(16), nullable=False),
        sa.Column("image_emoji", sa.String(8), nullable=False, server_default="🎴"),
        sa.Column("start_bid", sa.Float, nullable=False),
        sa.Column("current_bid", sa.Float, nullable=False),
        sa.Column("current_bidder_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("is_featured", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "bids",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("lot_id", sa.Integer, sa.ForeignKey("auction_lots.id"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "casino_spins",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("game", sa.String(16), nullable=False),
        sa.Column("bet", sa.Float, nullable=False),
        sa.Column("pick", sa.String(16), nullable=False),
        sa.Column("result", sa.String(16), nullable=False),
        sa.Column("payout", sa.Float, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    op.create_table(
        "jackpot",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("mpl", sa.Float, nullable=False, server_default="412000"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "feed_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("emoji", sa.String(8), nullable=False),
        sa.Column("text", sa.String(256), nullable=False),
        sa.Column("scope", sa.String(16), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("inviter_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("invitee_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("bonus_paid", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "promo_codes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(64), nullable=False, unique=True),
        sa.Column("mpl_bonus", sa.Float, nullable=False, server_default="0"),
        sa.Column("cbc_bonus", sa.Float, nullable=False, server_default="0"),
        sa.Column("uses_remaining", sa.Integer, nullable=False, server_default="0"),
        sa.Column("per_user", sa.Integer, nullable=False, server_default="1"),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "promo_redemptions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code_id", sa.Integer, sa.ForeignKey("promo_codes.id"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "daily_bonus",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("streak", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_claimed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    for t in [
        "daily_bonus", "promo_redemptions", "promo_codes", "referrals", "feed_events",
        "jackpot", "casino_spins", "bids", "auction_lots", "mining_farms",
        "price_ticks", "market_state", "trades", "orders", "balances", "users",
    ]:
        op.drop_table(t)
