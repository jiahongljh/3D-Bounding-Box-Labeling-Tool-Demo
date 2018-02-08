import os
import sys
from flask import Flask, jsonify, redirect, render_template, request, url_for
from nocache import nocache

app = Flask(__name__)

@app.route('/', methods=["GET", "POST"])
@nocache
def index():
	if request.method == "GET":

		return render_template("index.html")
	elif request.method == "POST":
		content = str(request.data)
		lines = content.split(';')
		filePath = 'static/input/Annotations/'
		for line in lines:
			if line == "b'" or line == "'":
				continue
			elif ".txt" in line:
				filePath += line
				f = open(filePath, "w")
			else:
				f.write(line)
				f.write('\n')
		f.close()
		return render_template("index.html")
