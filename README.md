# Turtle Lab 🐢

**Learn Python by drawing with a turtle.**
**تعلّم بايثون من خلال الرسم بالسلحفاة.**

Turtle Lab is a simple, colorful, kid-friendly web app that introduces children to programming through **Python Turtle graphics**. Learners write Python-style turtle commands, run the code in the browser, and instantly see drawings appear on the screen.

The project is inspired by the classic educational idea behind **Logo** and turtle graphics, but uses modern **Python-style syntax**.

---

## 🌟 What is Turtle Lab?

Turtle Lab is an educational coding playground for children, parents, and teachers.

It helps learners understand programming concepts visually by controlling a turtle that draws shapes, patterns, flowers, stars, houses, and creative projects.

Children can learn concepts such as:

* Sequencing
* Movement and angles
* Loops
* Colors
* Pen size
* Variables
* Functions
* Creative coding projects

---

## 🌍 Bilingual Support

Turtle Lab includes an English and Arabic landing page.

The home page explains the app, its educational background, technologies used, browser requirements, and credits in both languages.

Supported languages:

* English
* العربية

---

## 🧒 Who Is This For?

Turtle Lab is designed for:

* Children learning programming for the first time
* Parents introducing kids to coding
* Teachers running beginner programming lessons
* Coding clubs and STEM activities
* Anyone who wants a visual and playful way to start with Python

Suggested learner age:

**10–18 years old**

Younger learners may benefit from adult or teacher guidance.

---

## 💻 What Programming Language Does It Teach?

Turtle Lab teaches beginner-friendly **Python-style programming**.

Example:

```python
import turtle

t = turtle.Turtle()
t.color("blue")
t.pensize(3)

for i in range(4):
    t.forward(100)
    t.right(90)

turtle.done()
```

This program draws a blue square.

---

## 🐢 What Is Python Turtle?

Python Turtle is a beginner-friendly graphics module that lets learners draw by moving a turtle around the screen.

It is especially useful for teaching programming because the result of the code is visual and immediate.

Official documentation:

* [Python Official Website](https://www.python.org/)
* [Python Turtle Documentation](https://docs.python.org/3/library/turtle.html)

---

## 🧩 Technologies Used

Turtle Lab is a static web app built with standard web technologies.

Depending on the app version, it may use:

* HTML
* CSS
* JavaScript
* Python Turtle-style syntax
* Skulpt for running Python in the browser
* HTML Canvas or SVG for drawing output

Useful references:

* [Python](https://www.python.org/)
* [Python Turtle](https://docs.python.org/3/library/turtle.html)
* [Skulpt](https://skulpt.org/)
* [Skulpt GitHub Repository](https://github.com/skulpt/skulpt)
* [MDN Web Docs](https://developer.mozilla.org/)

---

## 📁 Project Structure

Recommended structure:

```text
turtle-lab/
├── index.html
├── app.html
├── README.md
├── assets/
│   ├── css/
│   ├── js/
│   └── libs/
└── images/
```

Suggested files:

| File         | Purpose                                      |
| ------------ | -------------------------------------------- |
| `index.html` | Landing page / home page                     |
| `app.html`   | Main Turtle Lab coding app                   |
| `README.md`  | Project documentation                        |
| `assets/`    | CSS, JavaScript, libraries, and other assets |
| `images/`    | Optional images or screenshots               |

---

## 🚀 Running Locally

To run the app locally:

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.
3. Click **Start Coding** to open the Turtle Lab app.

For best results, use a local static server.

Example using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## ✅ Requirements

Turtle Lab runs in a modern web browser.

Basic requirements:

* A laptop, desktop, tablet, or Chromebook
* A modern browser
* JavaScript enabled
* Enough screen space to view the code editor and drawing area
* Internet connection if external libraries are loaded from a CDN
* No Python installation required for the browser version

Recommended browsers:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox
* Safari
* Chromebook browser

---

## 🌐 Internet Requirement

The published website requires internet access for visitors to open it.

The app may also require internet access if it loads libraries from online CDN links.

For better reliability, especially in schools, it is recommended to host important libraries locally inside the project, for example:

```text
assets/libs/skulpt.min.js
assets/libs/skulpt-stdlib.js
```

This can help the app keep working even if a CDN is blocked or unavailable.

---

## 📚 Learning Content

Turtle Lab can include lessons such as:

1. Meet the turtle
2. Draw your first line
3. Turn left and right
4. Draw a square
5. Use loops
6. Draw triangles and polygons
7. Add colors
8. Change pen size
9. Fill shapes
10. Use coordinates
11. Create patterns
12. Use variables
13. Build functions
14. Create a final project

---

## 🎯 Example Activities

Children can use Turtle Lab to create:

* Squares
* Triangles
* Stars
* Spirals
* Flowers
* Houses
* Robot faces
* Rainbow patterns
* Custom artwork

Example:

```python
import turtle

t = turtle.Turtle()
t.color("purple")
t.speed(0)

for i in range(80):
    t.forward(i * 2)
    t.right(91)

turtle.done()
```

---

## 👨‍🏫 For Parents and Teachers

Turtle Lab is designed to make programming visual, playful, and less intimidating.

It introduces real programming ideas through experimentation. Children are encouraged to change numbers, colors, angles, and commands to discover how code affects the drawing.

Suggested teaching approach:

* Start with simple movement
* Ask learners to predict what the turtle will do
* Let them run the code and observe the result
* Encourage small changes
* Move gradually to loops, variables, and functions
* End with a creative project

---

## 🔒 Privacy

Turtle Lab is designed as a static web app.

Unless additional analytics, login, database, or tracking tools are added, the app does not require users to create accounts or submit personal information.

For children’s use, avoid adding unnecessary tracking or third-party scripts.

---

## ⚠️ Disclaimer

Turtle Lab is an independent educational project.

It is not officially affiliated with Python, the Python Software Foundation, Skulpt, Pyodide, GitHub, or any other referenced technology unless explicitly stated.

Technology names and links are included for educational reference and attribution.

---

## 🙏 Credits & References

This project is inspired by turtle graphics learning environments and beginner programming education.

References:

* [Python Official Website](https://www.python.org/)
* [Python Turtle Documentation](https://docs.python.org/3/library/turtle.html)
* [Skulpt Official Website](https://skulpt.org/)
* [Skulpt GitHub Repository](https://github.com/skulpt/skulpt)
* [MDN Web Docs](https://developer.mozilla.org/)

---

## 📄 License

Choose a license before publishing publicly.

Suggested options:

* **MIT License** if you want others to freely use, modify, and share the project.
* **Creative Commons Attribution-NonCommercial** if you want to allow educational sharing but restrict commercial use.
* **All Rights Reserved** if you do not want others to reuse the code without permission.

Add the selected license in a separate `LICENSE` file.

---

## 🐢 Project Status

Current status:

```text
Early public version / educational prototype
```

Planned improvements may include:

* More lessons
* More examples
* Save drawing as image
* Better mobile experience
* Offline-ready version
* Teacher mode
* More Arabic learning content
* Student challenge badges

---

## Start Learning

Open the app:

```text
index.html
```

Then click:

```text
Start Coding | ابدأ البرمجة
```

Happy coding with Turtle Lab! 🐢

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
