import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// ============================================================================
// INTERVIEW MODE - Professional interviewer persona
// ============================================================================
const INTERVIEWER_PROMPT = `You are an expert technical interviewer conducting a realistic coding interview. 

**Your persona**: Professional, evaluative, time-conscious. You simulate a real FAANG-style interview.

**Your role**:

1. **Topic Selection**: Ask what topic and difficulty they want to practice.

2. **Present Problem**: 
   - Select from LeetCode Top 150 / Blind 75
   - Give problem description, examples, constraints
   - Provide a code template in their preferred language
   - Do NOT give hints unless explicitly asked

3. **Interview Behavior**:
   - Let them think and struggle - this is practice for real interviews
   - If they ask clarifying questions, answer briefly
   - If they ask for hints, give SMALL hints, not full solutions
   - Ask them to explain their approach and complexity
   - You may ask follow-up questions like "Can you optimize this?"

4. **Evaluation** (when they submit):
   - Be fair but rigorous
   - Check correctness, edge cases, complexity
   - Give specific feedback on what was good and what could improve
   - **PASS**: Correct solution with reasonable complexity
   - **FAIL**: Has bugs, misses edge cases, or very inefficient
   - Include "[PASS]" or "[FAIL]" at the end

**Tone**: Professional, concise, encouraging but not overly helpful. Simulate interview pressure.`;

// ============================================================================
// MENTOR MODE (Roadmap) - Patient teacher persona
// ============================================================================
const MENTOR_PROMPT = `You are a patient and supportive coding mentor helping someone learn algorithms and data structures.

**Your persona**: Friendly teacher, patient, encouraging. Your goal is to help them LEARN, not just solve.

**Your role**:

1. **Present the Problem**:
   - Explain the problem clearly with examples
   - Provide a code template
   - Ask if they understand before proceeding

2. **Teaching Approach**:
   - If they're stuck, TEACH them. Don't just give hints - explain the concept.
   - Break down problems into smaller steps
   - Explain the intuition behind the approach
   - Use analogies and visual explanations when helpful
   - Walk through examples step by step

3. **When They Say "I don't know" or Ask to Learn**:
   - This is your cue to TEACH, not hint
   - Explain the algorithm/pattern needed
   - Show how to think about the problem
   - Provide pseudocode or step-by-step logic
   - Then let them try to implement it

4. **Code Review**:
   - When they write code, explain what's good
   - If there are bugs, explain WHY they're bugs
   - Teach them to debug and trace through examples

5. **Solution Teaching**:
   - If they really can't solve it, it's okay to show the solution
   - But ALWAYS explain the WHY, not just the WHAT
   - Discuss time/space complexity and why this approach works
   - Mention common variations or follow-up questions

6. **Evaluation** (when they submit):
   - Be encouraging but honest
   - If correct: celebrate and reinforce what they learned
   - If incorrect: explain the issue and help them fix it
   - **PASS**: Solution works correctly
   - **FAIL**: Has issues (but frame it as a learning opportunity)
   - Include "[PASS]" or "[FAIL]" at the end

**Tone**: Warm, patient, educational. Use phrases like:
- "Great question! Let me explain..."
- "Don't worry, this is a tricky concept. Here's how to think about it..."
- "You're on the right track! Let's build on that..."
- "This is a common pattern called X. Here's how it works..."

**Remember**: Your goal is for them to UNDERSTAND, not just get the answer.`;

// Helper function to extract code template from AI response
function extractCodeTemplate(response: string): { code: string; language: string } | null {
  // Look for code blocks with any language
  const codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)\n```/;
  const match = response.match(codeBlockRegex);
  
  if (match && match[2]) {
    const detectedLanguage = match[1].toLowerCase();
    const code = match[2].trim();
    
    // Map common language names to our supported languages
    const languageMap: { [key: string]: string } = {
      'javascript': 'javascript',
      'js': 'javascript',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
    };
    
    const mappedLanguage = languageMap[detectedLanguage] || detectedLanguage;
    
    return { code, language: mappedLanguage };
  }
  
  return null;
}

// Boilerplate code templates for common LeetCode problems
const BOILERPLATE_TEMPLATES: { [key: string]: { [lang: string]: string } } = {
  'Two Sum': {
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your solution here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your solution here
};`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
  },
  'Contains Duplicate': {
    python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Write your solution here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Write your solution here
};`,
  },
  'Valid Anagram': {
    python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Write your solution here
        pass`,
    javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    // Write your solution here
};`,
  },
  'Valid Palindrome': {
    python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your solution here
        pass`,
    javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
    // Write your solution here
};`,
  },
  'Reverse Linked List': {
    python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        # Write your solution here
        pass`,
    javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var reverseList = function(head) {
    // Write your solution here
};`,
  },
  'Invert Binary Tree': {
    python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        # Write your solution here
        pass`,
    javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
var invertTree = function(root) {
    // Write your solution here
};`,
  },
};

// Get boilerplate for a problem, fallback to generic template
function getBoilerplate(problemTitle: string, language: string): { code: string; language: string } | null {
  const templates = BOILERPLATE_TEMPLATES[problemTitle];
  if (templates) {
    const code = templates[language] || templates['python'] || Object.values(templates)[0];
    const lang = templates[language] ? language : (templates['python'] ? 'python' : Object.keys(templates)[0]);
    return { code, language: lang };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const userApiKey = request.headers.get('x-google-api-key')?.trim();
    const serverKey = process.env.GOOGLE_API_KEY?.trim();
    const apiKey = (userApiKey && userApiKey.length > 0) ? userApiKey : serverKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'No API key provided. Add your Google AI (Gemini) key in Settings, or ask the app owner to set GOOGLE_API_KEY.',
        },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { messages, code, language, problemContext, requestBoilerplateOnly } = await request.json();

    // Fast path: if just requesting boilerplate, try to return from cache first
    if (requestBoilerplateOnly && problemContext) {
      const cachedBoilerplate = getBoilerplate(problemContext.title, language);
      if (cachedBoilerplate) {
        return NextResponse.json({
          response: '',
          codeTemplate: cachedBoilerplate.code,
          templateLanguage: cachedBoilerplate.language,
          passed: false,
        });
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Choose prompt based on whether there's a specific problem selected (Mentor mode) or not (Interview mode)
    const isMentorMode = !!problemContext;
    
    // Special prompt for boilerplate-only requests
    const boilerplatePrompt = requestBoilerplateOnly
      ? `Provide ONLY the LeetCode-style function boilerplate/starter code for "${problemContext.title}" in ${language}. 
         Include the class Solution and method signature with proper type hints.
         Include a comment "// Write your solution here" or "# Write your solution here".
         Do NOT include any explanation, just the code block.`
      : null;

    const systemPrompt = boilerplatePrompt || (isMentorMode 
      ? `${MENTOR_PROMPT}\n\nThe student is working on: "${problemContext.title}" (${problemContext.category}, ${problemContext.difficulty})`
      : INTERVIEWER_PROMPT);

    // Build chat history with system prompt
    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const initialModelResponse = isMentorMode
      ? `Hey! Let's learn **${problemContext.title}** together. I'll guide you through this step by step. Feel free to ask questions anytime - I'm here to help you understand, not just solve it!`
      : 'Hello! I\'m your AI interviewer. Let\'s start with selecting a topic. What would you like to practice today? (e.g., Arrays, Strings, Dynamic Programming, Trees, Graphs)';

    const chat = model.startChat({
      history: requestBoilerplateOnly ? [] : [
        {
          role: 'user',
          parts: [{ text: 'You are my interviewer. Follow these instructions:\n\n' + systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: initialModelResponse }],
        },
        ...history,
      ],
    });

    const lastMessage = messages[messages.length - 1];
    
    // Include code context and language preference
    let messageWithContext = requestBoilerplateOnly ? systemPrompt : lastMessage.content;
    if (!requestBoilerplateOnly) {
      if (code && code.trim() && !code.includes('// Write your solution here') && !code.includes('# Write your solution here')) {
        messageWithContext = `${lastMessage.content}\n\n[Current code in ${language} editor]:\n\`\`\`${language}\n${code}\n\`\`\``;
      } else {
        // Just mention the language preference
        messageWithContext = `${lastMessage.content}\n\n[Candidate's preferred language: ${language}]`;
      }
    }
    
    const result = await chat.sendMessage(messageWithContext);
    const response = result.response.text();

    // Check if response contains a code template
    const templateData = extractCodeTemplate(response);

    // Check if the AI indicated pass or fail
    const passed = response.includes('[PASS]');
    const failed = response.includes('[FAIL]');

    return NextResponse.json({ 
      response: requestBoilerplateOnly ? '' : response.replace('[PASS]', '').replace('[FAIL]', '').trim(),
      codeTemplate: templateData?.code,
      templateLanguage: templateData?.language,
      passed: passed && !failed,
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}

