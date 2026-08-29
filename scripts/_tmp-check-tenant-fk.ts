import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function main() {
  const payload = await getPayload({ config: configPromise })

  const res = await payload.db.drizzle.execute(`
    select
      tc.table_name as referencing_table,
      kcu.column_name as referencing_column,
      ccu.table_name as referenced_table,
      ccu.column_name as referenced_column,
      rc.delete_rule
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
    join information_schema.referential_constraints rc on tc.constraint_name = rc.constraint_name
    join information_schema.constraint_column_usage ccu on rc.unique_constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'tenant_id'
    order by tc.table_name;
  `)
  console.log(JSON.stringify(res.rows, null, 2))

  // Also confirm the tenants table's primary key column/type.
  const pk = await payload.db.drizzle.execute(`
    select column_name, data_type from information_schema.columns
    where table_name = 'tenants' order by ordinal_position
  `)
  console.log('tenants table columns:', JSON.stringify(pk.rows, null, 2))

  process.exit(0)
}

main()
