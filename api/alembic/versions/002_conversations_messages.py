"""Conversations + messages + agent color/system_prompt.

Revision ID: 002
Revises: 001
Create Date: 2026-05-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agents", sa.Column("color", sa.String(20), nullable=True))
    op.add_column("agents", sa.Column("system_prompt", sa.Text(), nullable=True))

    op.execute("UPDATE agents SET color='#f472b6' WHERE agent_type='hermes'")
    op.execute("UPDATE agents SET color='#a78bfa' WHERE agent_type='claude'")
    op.execute("UPDATE agents SET color='#34d399' WHERE agent_type='codex'")
    op.execute("UPDATE agents SET color='#60a5fa' WHERE agent_type='gemini'")

    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("agent_id", sa.Integer(), sa.ForeignKey("agents.id"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False, server_default="New conversation"),
        sa.Column("model", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "conv_messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("conv_messages")
    op.drop_table("conversations")
    op.drop_column("agents", "system_prompt")
    op.drop_column("agents", "color")
