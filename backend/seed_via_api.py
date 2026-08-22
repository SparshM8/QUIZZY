import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTgzNzU3YjM0MTIwNTM1NDBjZDAyNDciLCJlbWFpbCI6ImNhbGxtZThzYW1heUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg3MzY0MTc0LCJleHAiOjE3ODczNjUwNzQsImp0aSI6IjFkMThlNjUyLTZkYWItNGVmZS1iODg2LWJkMjUyM2E1ZmQ1MyJ9.xlzxMpdPfQEX6082uvJmf-k-xEvFE3wCzJV9I_euaZg"
BASE_URL = "https://quizzy-git-main-sparsh-mishras-projects-870ea013.vercel.app/api"

questions = [
    {
        "title": "Longest Substring Without Repeating Characters (Python)",
        "statement": "Given a string s, find the length of the longest substring without repeating characters.\n\nExample:\nInput: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.",
        "difficulty": "medium",
        "tags": ["Python", "Coding", "Algorithms", "String"],
        "type": "coding",
        "points": 30,
        "coding": {
            "starterCode": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your code here\n        pass",
            "solution": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_map = {}\n        left = 0\n        max_len = 0\n        for right in range(len(s)):\n            if s[right] in char_map:\n                left = max(left, char_map[s[right]] + 1)\n            char_map[s[right]] = right\n            max_len = max(max_len, right - left + 1)\n        return max_len",
            "timeLimitMs": 2000,
            "memoryLimitKb": 262144,
            "testCases": [
                { "input": "\"abcabcbb\"", "expectedOutput": "3", "timeLimitMs": 1000 },
                { "input": "\"bbbbb\"", "expectedOutput": "1", "timeLimitMs": 1000 },
                { "input": "\"pwwkew\"", "expectedOutput": "3", "timeLimitMs": 1000 }
            ]
        }
    },
    {
        "title": "Reverse Linked List (C++)",
        "statement": "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nExample:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]",
        "difficulty": "easy",
        "tags": ["C++", "Coding", "Data Structures", "Linked List"],
        "type": "coding",
        "points": 20,
        "coding": {
            "starterCode": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your code here\n    }\n};",
            "solution": "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* curr = head;\n        while (curr) {\n            ListNode* nextTemp = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = nextTemp;\n        }\n        return prev;\n    }\n};",
            "timeLimitMs": 1000,
            "memoryLimitKb": 262144,
            "testCases": [
                { "input": "[1,2,3,4,5]", "expectedOutput": "[5,4,3,2,1]", "timeLimitMs": 500 },
                { "input": "[1,2]", "expectedOutput": "[2,1]", "timeLimitMs": 500 }
            ]
        }
    },
    {
        "title": "Merge K Sorted Lists (Java)",
        "statement": "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.\n\nExample:\nInput: lists = [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]",
        "difficulty": "hard",
        "tags": ["Java", "Coding", "Algorithms", "Heap", "Linked List"],
        "type": "coding",
        "points": 50,
        "coding": {
            "starterCode": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your code here\n    }\n}",
            "solution": "import java.util.PriorityQueue;\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        if (lists == null || lists.length == 0) return null;\n        PriorityQueue<ListNode> queue = new PriorityQueue<>((a, b) -> a.val - b.val);\n        for (ListNode node : lists) {\n            if (node != null) queue.add(node);\n        }\n        ListNode dummy = new ListNode(0);\n        ListNode tail = dummy;\n        while (!queue.isEmpty()) {\n            tail.next = queue.poll();\n            tail = tail.next;\n            if (tail.next != null) queue.add(tail.next);\n        }\n        return dummy.next;\n    }\n}",
            "timeLimitMs": 3000,
            "memoryLimitKb": 524288,
            "testCases": [
                { "input": "[[1,4,5],[1,3,4],[2,6]]", "expectedOutput": "[1,1,2,3,4,4,5,6]", "timeLimitMs": 2000 },
                { "input": "[]", "expectedOutput": "[]", "timeLimitMs": 1000 }
            ]
        }
    }
]

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

for q in questions:
    response = requests.post(f"{BASE_URL}/questions", headers=headers, data=json.dumps(q))
    if response.status_code == 201:
        print(f"Successfully created: {q['title']}")
    else:
        print(f"Failed to create {q['title']}: {response.status_code} - {response.text}")
