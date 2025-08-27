import { NextRequest, NextResponse } from 'next/server';
import { Table } from '@/lib/models';



// DELETE /api/v1/table - Delete a table
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json({ success: false, error: 'Table ID is required' }, { status: 400 });
      }
  
      const table = await Table.findByPk(id);
      if (!table) {
        return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
      }
  
      await table.destroy();
      
      return NextResponse.json({ success: true, message: 'Table deleted successfully' });
    } catch (error) {
      console.error('Delete table error:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete table' }, { status: 500 });
    }
  }
  
  
  export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;
      const body = await request.json();

      //check if the body is valid
    //   if (!body.name || !body.status) {
    //     return NextResponse.json({ success: false, error: 'Name and status are required' }, { status: 400 });
    //   }

      if (!id) {
        return NextResponse.json({ success: false, error: 'Table ID is required' }, { status: 400 });
      }
  
      const table = await Table.findByPk(id);
      if (!table) {
        return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
      }
  
      await table.update(body);
  
      return NextResponse.json({ success: true, message: 'Table updated successfully' });
    }catch(error){
      console.error('Error updating table:', error);
      return NextResponse.json({ success: false, error: 'Failed to update table' }, { status: 500 });
    }
  }