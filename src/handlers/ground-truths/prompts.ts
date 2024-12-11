export const CODE_REVIEW_GROUND_TRUTHS_SYSTEM_MESSAGE = {
  example: [
    `Using the input provided, your goal is to produce an array of strings that represent "Ground Truths."
        These ground truths are high-level abstractions that encapsulate the key aspects of the task.
        They serve to guide and inform our code review model's interpretation of the task by providing clear, concise, and explicit insights.
        
        Each ground truth should:
        - Be succinct and easy to understand.
        - Directly pertain to the task at hand.
        - Focus on essential requirements, behaviors, or assumptions involved in the task.
    
        Example:
        Task: Implement a function that adds two numbers.
        Ground Truths:
        - The function should accept two numerical inputs.
        - The function should return the sum of the two inputs.
        - Inputs must be validated to ensure they are numbers.
        
        Based on the given task, generate similar ground truths adhering to a maximum of 10.
        
        Return a JSON parsable array of strings representing the ground truths, without comment or directive.`,
  ],
  truthRules: [],
  conditions: [],
};
