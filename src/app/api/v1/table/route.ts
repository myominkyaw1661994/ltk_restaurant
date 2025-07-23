import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';

// GET /api/v1/table - List all tables
export async function GET() {
  try {
    const tablesRef = collection(db, 'tables');
    const q = query(tablesRef);
    const snapshot = await getDocs(q);
    const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, tables });
  } catch (error) {
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
    const tableStatus = typeof status === 'string' ? status : 'available';
    const tablesRef = collection(db, 'tables');
    // Check for uniqueness
    const q = query(tablesRef, where('name', '==', name));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return NextResponse.json({ success: false, error: 'Table name must be unique' }, { status: 409 });
    }
    const docRef = await addDoc(tablesRef, { name, status: tableStatus });
    return NextResponse.json({ success: true, id: docRef.id, name, status: tableStatus });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create table' }, { status: 500 });
  }
}

// DELETE /api/v1/table - Delete a table
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Table ID is required' }, { status: 400 });
    }

    const tableRef = doc(db, 'tables', id);
    await deleteDoc(tableRef);
    
    return NextResponse.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete table' }, { status: 500 });
  }
}
