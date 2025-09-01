import { NextRequest, NextResponse } from 'next/server';
import { Table } from '@/lib/models';

// GET /api/v1/table - List tables (optionally filter by available)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const availableParam = searchParams.get('avaiable') ?? searchParams.get('available');
    const onlyAvailable = typeof availableParam === 'string' && ['true', 'ture', '1', 'yes'].includes(availableParam.toLowerCase());

    const tables = await Table.findAll({
      where: onlyAvailable ? { status: 'available' } : undefined,
      order: [['created_at', 'ASC']],
      raw: true,
    });
    

    console.log("tables", tables)
    return NextResponse.json({
      success: true,
      tables: tables.map(table => ({
        id: table.id,
        name: table.name,
        status: table.status,
        created_at: table.created_at,
        updated_at: table.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tables' }, { status: 500 });
  }
}

// POST /api/v1/table - Create a new table
export async function POST(request: NextRequest) {
  try {
    const { name, status } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Table name is required' }, { status: 400 });
    }
    
    const tableStatus = (typeof status === 'string' && ['available', 'occupied', 'reserved'].includes(status)) 
      ? status as 'available' | 'occupied' | 'reserved' 
      : 'available';
    
    // Check for uniqueness
    const existingTable = await Table.findOne({ where: { name } });
    if (existingTable) {
      return NextResponse.json({ success: false, error: 'Table name must be unique' }, { status: 409 });
    }
    
    const table = await Table.create({ 
      name: name.trim(), 
      status: tableStatus 
    });
    
    return NextResponse.json({ 
      success: true, 
      id: table.id, 
      name: table.name, 
      status: table.status 
    });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ success: false, error: 'Failed to create table' }, { status: 500 });
  }
}
