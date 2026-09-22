"""Request-scoped tenant isolation for ORM reads, writes and references."""
from fastapi import HTTPException
from sqlalchemy import event, inspect, select
from sqlalchemy.orm import Session, with_loader_criteria


def tenant_models():
    from .database import Base
    return [m.class_ for m in Base.registry.mappers if hasattr(m.class_, 'tenant_id')]


@event.listens_for(Session, 'do_orm_execute')
def scope_queries(state):
    tenant_id = state.session.info.get('tenant_id')
    if tenant_id is None:
        return
    if not state.is_orm_statement:
        raise HTTPException(403, 'Firma oturumunda doğrudan SQL çalıştırılamaz.')
    for model in tenant_models():
        state.statement = state.statement.options(with_loader_criteria(
            model, model.tenant_id == tenant_id, include_aliases=True))


@event.listens_for(Session, 'before_flush')
def scope_writes(session, flush_context, instances):
    tenant_id = session.info.get('tenant_id')
    if tenant_id is None:
        return
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if not hasattr(obj, 'tenant_id'):
            continue
        if obj in session.new:
            if obj.tenant_id not in (None, tenant_id):
                raise HTTPException(403, 'Başka firma adına kayıt oluşturulamaz.')
            obj.tenant_id = tenant_id
            if hasattr(obj, 'branch_id') and obj.branch_id is None:
                obj.branch_id = session.info.get('branch_id')
        elif obj.tenant_id != tenant_id or inspect(obj).attrs.tenant_id.history.has_changes():
            raise HTTPException(403, 'Firma aidiyeti değiştirilemez.')
        # Validate foreign keys as well as the row itself (prevents cross-tenant IDOR).
        for column in inspect(type(obj)).columns:
            value = getattr(obj, column.key)
            if value is None or column.key == 'tenant_id':
                continue
            for fk in column.foreign_keys:
                table = fk.column.table
                if 'tenant_id' not in table.c:
                    continue
                owner = session.connection().execute(select(table.c.tenant_id).where(fk.column == value)).scalar()
                if owner != tenant_id:
                    raise HTTPException(422, f'{column.key}: kayıt bu firmaya ait değil.')
