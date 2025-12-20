'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const ConflictAnalyzer = () => {
  const [showContext, setShowContext] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="../" className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Conflict Analysis</h1>
              <p className="text-gray-400 text-sm">src/routes/users.ts • Lines 22-35</p>
            </div>
            <button className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Re-analyze Conflict
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded text-xs font-medium border border-purple-500/20 uppercase tracking-wider">
            Mixed
          </div>
          <div className="bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded text-xs border border-amber-500/20">
            moderate complexity
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-400">OURS</span>
                <span className="text-xs text-gray-500">(no branch, rebasing feature/api-v2)</span>
              </div>
            </div>
            <div className="p-4">
              <pre className="text-xs leading-relaxed font-mono">
                <code className="text-gray-300">
{`router.get('/users/:id', async (req, res) => {
  const user = await UserService.getById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
});
  res.json(user);
});`}
                </code>
              </pre>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-400">THEIRS</span>
                <span className="text-xs text-gray-500">incoming</span>
              </div>
            </div>
            <div className="p-4">
              <pre className="text-xs leading-relaxed font-mono">
                <code className="text-gray-300">
{`router.get('/users/:id', validateParams(userIdSchema), async (req, res) => {
  const user = await userRepository.findById(req.validatedParams.id);
  if (!user) throw new NotFoundError('User not found');
  res.json(userSerializer.serialize(user));
});`}
                </code>
              </pre>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wider">
              What OURS changed:
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The current branch's version of the GET /users/:id route handler uses the UserService to fetch the user by ID and returns the user object directly. If the user is not found, it returns a 404 Not Found response.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wider">
              What THEIRS changed:
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The incoming version of the GET /users/:id route handler uses the userRepository to fetch the user by ID, validates the ID using the userIdSchema, and serializes the user object using the userSerializer before returning it. If the user is not found, it throws a NotFoundError.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wider">
              Why this conflict occurred:
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The two versions of the route handler have different implementations, with the current branch's version using a UserService and the incoming version using a userRepository and serializer. Additionally, the error handling and response formats differ between the two versions.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg border border-green-800/30 p-6">
            <h3 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wider">
              Suggested resolution strategy:
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Merge the two versions by keeping the core functionality of fetching the user by ID, but combine the error handling and response formatting. Use the userRepository and serializer from the incoming version, but handle the NotFoundError and return a 404 response like the current branch's version.
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="../result" className="bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            View Resolution Steps
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConflictAnalyzer;