# Contributing Guidelines

Thank you for considering contributing to the **Teknofest Blockchain** project! Please follow these guidelines to make the process smooth and efficient.

## How to Contribute

1. **Fork the Repository**
   - Click the **Fork** button on GitHub to create your own copy.
2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/teknofest_blokzincir.git
   cd teknofest_blokzincir
   ```
3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make Your Changes**
   - Follow the existing code style and conventions.
   - Add or update documentation where appropriate.
5. **Run Tests**
   ```bash
   npx hardhat test
   ```
6. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: brief description of your change"
   ```
7. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request**
   - Provide a clear description of the changes and reference any related issues.

## Code Style
- Use **Solidity ^0.8.0** conventions for contracts.
- JavaScript/Node files should follow **ESLint** recommended rules.
- Keep line length under 120 characters.

## Testing
- Write unit tests for any new contract functionality.
- Ensure all existing tests pass before submitting a PR.

## Reporting Issues
- Use the GitHub **Issues** tab to report bugs or request features.
- Include steps to reproduce, expected behavior, and screenshots if applicable.

## License
By contributing, you agree that your contributions will be licensed under the same MIT license as the project.
