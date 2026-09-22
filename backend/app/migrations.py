"""Add ownership columns without silently assigning ambiguous historical records."""
from sqlalchemy import inspect, text
from . import models
from .database import Base


def migrate(engine):
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing:
                continue
            columns = {c['name'] for c in inspector.get_columns(table.name)}
            if 'tenant_id' in table.c and 'tenant_id' not in columns:
                conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN tenant_id INTEGER REFERENCES tenant_companies(id)'))
            if 'snapshot_json' in table.c and 'snapshot_json' not in columns:
                conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN snapshot_json TEXT'))
        # Infer ownership from actual parent records, never from the logged-in user.
        for _ in range(4):
            for table in Base.metadata.sorted_tables:
                if table.name not in existing or 'tenant_id' not in table.c:
                    continue
                for column in table.c:
                    for fk in column.foreign_keys:
                        parent = fk.column.table
                        if column.name == 'tenant_id' or 'tenant_id' not in parent.c or parent.name not in existing:
                            continue
                        conn.execute(text(f'UPDATE "{table.name}" SET tenant_id = (SELECT tenant_id FROM "{parent.name}" WHERE "{parent.name}"."{fk.column.name}" = "{table.name}"."{column.name}") WHERE tenant_id IS NULL'))
        # Only a single-company database can safely own otherwise unlinked legacy rows.
        if 'tenant_companies' in existing:
            ids = conn.execute(text('SELECT id FROM tenant_companies')).scalars().all()
            if len(ids) == 1:
                for table in Base.metadata.sorted_tables:
                    if table.name in existing and 'tenant_id' in table.c and table.name not in {'auth_sessions', 'tenant_backup_logs'}:
                        conn.execute(text(f'UPDATE "{table.name}" SET tenant_id=:tenant WHERE tenant_id IS NULL'), {'tenant': ids[0]})
    Base.metadata.create_all(engine)
