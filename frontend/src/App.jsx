import { useState } from 'react';

function App() {
  const [inputData, setInputData] = useState('[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);
    setLoading(true);

    try {
      // Parse the input text into a JSON array
      const parsedData = JSON.parse(inputData);
      
      if (!Array.isArray(parsedData)) {
        throw new Error("Input must be a valid JSON array.");
      }

      // Call the Node.js API
      // TODO: When hosting, change this URL to your Render/Railway backend URL
      const res = await fetch('http://localhost:3000/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);

    } catch (err) {
      setError(err.message || 'Invalid JSON format or API failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Bajaj Full-stack Challenge</h1>
          <p className="text-gray-500 mt-1">Hierarchical Graph Processor</p>
        </header>

        {/* Input Section */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Input Array (JSON format)
          </label>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-gray-50"
            placeholder='["A->B", "B->C"]'
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Process Data'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <span className="font-bold">Error: </span>{error}
            </div>
          )}
        </form>

        {/* Results Section */}
        {response && (
          <div className="space-y-6">
            
            {/* Identity & Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Student Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-gray-700">User ID:</span> {response.user_id}</p>
                  <p><span className="font-semibold text-gray-700">Email:</span> {response.email_id}</p>
                  <p><span className="font-semibold text-gray-700">Roll No:</span> {response.college_roll_number}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 bg-blue-50/30">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Summary Insights</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{response.summary.total_trees}</p>
                    <p className="text-xs text-gray-500 font-medium">Valid Trees</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{response.summary.total_cycles}</p>
                    <p className="text-xs text-gray-500 font-medium">Cyclic Groups</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{response.summary.largest_tree_root || "N/A"}</p>
                    <p className="text-xs text-gray-500 font-medium">Largest Root</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrays Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-red-500 mb-2">Invalid Entries</h4>
                <div className="flex flex-wrap gap-2">
                  {response.invalid_entries.length ? response.invalid_entries.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-mono">{item}</span>
                  )) : <span className="text-sm text-gray-400">None</span>}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-orange-500 mb-2">Duplicate Edges</h4>
                <div className="flex flex-wrap gap-2">
                  {response.duplicate_edges.length ? response.duplicate_edges.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md font-mono">{item}</span>
                  )) : <span className="text-sm text-gray-400">None</span>}
                </div>
              </div>
            </div>

            {/* Hierarchies JSON View */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Hierarchies Tree View</h3>
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                {JSON.stringify(response.hierarchies, null, 2)}
              </pre>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;