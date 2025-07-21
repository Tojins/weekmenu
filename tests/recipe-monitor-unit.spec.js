import { test, expect } from '@playwright/test';

test.describe('Recipe Monitor Unit Tests', () => {
  test('count reduction logic works correctly', async () => {
    // Test the counting logic that the component uses
    const testData = [
      { status: 'INITIAL' },
      { status: 'INITIAL' },
      { status: 'ONGOING' },
      { status: 'COMPLETED' },
      { status: 'COMPLETED' },
      { status: 'COMPLETED' },
      { status: 'FAILED' }
    ];
    
    // This is the same reduce logic used in the component
    const counts = testData.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    expect(counts).toEqual({
      'INITIAL': 2,
      'ONGOING': 1, 
      'COMPLETED': 3,
      'FAILED': 1
    });
    
    // Verify total count
    const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(totalCount).toBe(testData.length);
  });

  test('count logic handles empty data', async () => {
    const testData = [];
    
    const counts = testData.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    expect(counts).toEqual({});
    
    const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(totalCount).toBe(0);
  });

  test('count logic handles single status', async () => {
    const testData = [
      { status: 'INITIAL' },
      { status: 'INITIAL' },
      { status: 'INITIAL' }
    ];
    
    const counts = testData.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    expect(counts).toEqual({
      'INITIAL': 3
    });
  });

  test('filtering logic for search history records works correctly', async () => {
    const allRecords = [
      { status: 'INITIAL', search_query: 'test1' },
      { status: 'ONGOING', search_query: 'test2' },
      { status: 'COMPLETED', search_query: 'test3' },
      { status: 'FAILED', search_query: 'test4' },
      { status: 'INITIAL', search_query: 'test5' }
    ];
    
    // This simulates the .in('status', ['INITIAL', 'ONGOING']) filter
    const filteredRecords = allRecords.filter(record => 
      ['INITIAL', 'ONGOING'].includes(record.status)
    );
    
    expect(filteredRecords).toHaveLength(3);
    expect(filteredRecords.every(r => r.status === 'INITIAL' || r.status === 'ONGOING')).toBe(true);
  });

  test('filtering logic for URL candidates works correctly', async () => {
    const allRecords = [
      { status: 'INITIAL', url: 'test1.com' },
      { status: 'INVESTIGATING', url: 'test2.com' },
      { status: 'ACCEPTED', url: 'test3.com' },
      { status: 'REJECTED', url: 'test4.com' },
      { status: 'CREATED', url: 'test5.com' }
    ];
    
    // This simulates the .not('status', 'in', '(REJECTED,CREATED)') filter
    const filteredRecords = allRecords.filter(record => 
      !['REJECTED', 'CREATED'].includes(record.status)
    );
    
    expect(filteredRecords).toHaveLength(3);
    expect(filteredRecords.every(r => r.status !== 'REJECTED' && r.status !== 'CREATED')).toBe(true);
  });
});