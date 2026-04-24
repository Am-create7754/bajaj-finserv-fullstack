const express = require('express');
const cors = require('cors');

const app = express();

// Required: Enable CORS for the evaluator
app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;

        // Validation for missing or invalid data format
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: "Invalid input. Expected an array 'data'." });
        }

        // Base response object
        const response = {
            "user_id": "ambersahay_12012005", 
            "email_id": "as8306@srmist.edu.in", 
            "college_roll_number": "RA2311030010223",
            "hierarchies": [],
            "invalid_entries": [],
            "duplicate_edges": [],
            "summary": {
                "total_trees": 0,
                "total_cycles": 0,
                "largest_tree_root": ""
            }
        };

        // --- GRAPH PROCESSING LOGIC STARTS HERE ---

        const invalid_entries = [];
        const duplicate_edges = [];
        const seenEdges = new Set();
        
        const adj = {};       // Adjacency list: parent -> array of children
        const hasParent = {}; // Tracks if a node already has a parent (Diamond rule)
        const allNodes = new Set();

        // 1. Parse and Validate
        data.forEach(rawItem => {
            if (typeof rawItem !== 'string' || !rawItem.trim()) {
                invalid_entries.push(rawItem);
                return;
            }

            const edge = rawItem.trim();
            
            // Regex: Exactly one uppercase letter, an arrow, one uppercase letter
            const isValidFormat = /^[A-Z]->[A-Z]$/.test(edge);
            
            if (!isValidFormat || edge[0] === edge[3]) { 
                // Invalid format OR Self-loop (A->A)
                invalid_entries.push(rawItem);
            } else if (seenEdges.has(edge)) {
                // Duplicate edge
                duplicate_edges.push(edge);
            } else {
                // Valid edge
                seenEdges.add(edge);
                const parent = edge[0];
                const child = edge[3];

                allNodes.add(parent);
                allNodes.add(child);

                // Diamond Rule: If child already has a parent, silently discard this edge
                if (!hasParent[child]) {
                    hasParent[child] = true;
                    if (!adj[parent]) adj[parent] = [];
                    adj[parent].push(child);
                }
            }
        });

        // 2. Helper: Depth First Search for Cycle Detection and Tree Building
        const globalVisited = new Set();
        
        function buildTree(node, currentPath) {
            if (currentPath.has(node)) {
                return { hasCycle: true, tree: {}, depth: 0 };
            }

            currentPath.add(node);
            globalVisited.add(node);

            if (!adj[node] || adj[node].length === 0) {
                currentPath.delete(node);
                return { hasCycle: false, tree: {}, depth: 1 };
            }

            let cycleDetected = false;
            let maxDepth = 0;
            const currentTree = {};

            // Sort children alphabetically
            adj[node].sort().forEach(child => {
                const childResult = buildTree(child, currentPath);
                if (childResult.hasCycle) {
                    cycleDetected = true;
                } else {
                    currentTree[child] = childResult.tree;
                    maxDepth = Math.max(maxDepth, childResult.depth);
                }
            });

            currentPath.delete(node);

            if (cycleDetected) {
                return { hasCycle: true, tree: {}, depth: 0 };
            }

            return { hasCycle: false, tree: currentTree, depth: maxDepth + 1 };
        }

        // 3. Find Roots and Build Hierarchies
        const hierarchies = [];
        let total_trees = 0;
        let total_cycles = 0;
        let largest_tree_root = "";
        let maxTreeDepth = 0;

        // A root is any node that doesn't have a parent
        let roots = Array.from(allNodes).filter(n => !hasParent[n]);
        roots.sort(); // Sort alphabetically for consistency

        roots.forEach(root => {
            const result = buildTree(root, new Set());
            const hierarchyObj = { root: root, tree: result.tree };
            
            if (result.hasCycle) {
                hierarchyObj.has_cycle = true;
                total_cycles++;
            } else {
                hierarchyObj.depth = result.depth;
                total_trees++;
                
                // Track largest tree root
                if (result.depth > maxTreeDepth) {
                    maxTreeDepth = result.depth;
                    largest_tree_root = root;
                } else if (result.depth === maxTreeDepth) {
                    // Tiebreaker: Lexicographically smaller root
                    if (root < largest_tree_root || largest_tree_root === "") {
                        largest_tree_root = root;
                    }
                }
            }
            hierarchies.push(hierarchyObj);
        });

        // 4. Handle "Pure Cycles" (Nodes isolated in a loop with no valid root)
        const unvisitedNodes = Array.from(allNodes).filter(n => !globalVisited.has(n));
        if (unvisitedNodes.length > 0) {
            unvisitedNodes.sort(); 
            const pureCycleRoot = unvisitedNodes[0]; // Lexicographically smallest as root
            hierarchies.push({
                root: pureCycleRoot,
                tree: {},
                has_cycle: true
            });
            total_cycles++;
        }

        // Map final data to response object
        response.hierarchies = hierarchies;
        response.invalid_entries = invalid_entries;
        response.duplicate_edges = duplicate_edges;
        response.summary.total_trees = total_trees;
        response.summary.total_cycles = total_cycles;
        response.summary.largest_tree_root = largest_tree_root;

        // --- GRAPH PROCESSING LOGIC ENDS HERE ---

        return res.json(response);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});