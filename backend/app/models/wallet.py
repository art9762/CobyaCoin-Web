from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Balance(Base):
    __tablename__ = "balances"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    cbc: Mapped[float] = mapped_column(Float, default=0.0)
    mpl: Mapped[float] = mapped_column(Float, default=0.0)
    frozen_cbc: Mapped[float] = mapped_column(Float, default=0.0)
    frozen_mpl: Mapped[float] = mapped_column(Float, default=0.0)
