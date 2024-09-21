import struct

"""
# List of geometric vertices, with (x, y, z, [w]) coordinates, w is optional and defaults to 1.0.
v 0.123 0.234 0.345 1.0
v ...
...
# List of texture coordinates, in (u, [v, w]) coordinates, these will vary between 0 and 1. v, w are optional and default to 0.
vt 0.500 1 [0]
vt ...
...
# List of vertex normals in (x,y,z) form; normals might not be unit vectors.
vn 0.707 0.000 0.707
vn ...
...
# Parameter space vertices in (u, [v, w]) form; free form geometry statement (see below)
vp 0.310000 3.210000 2.100000
vp ...
...
# Polygonal face element (see below)
f 1 2 3
f 3/1 4/2 5/3
f 6/4/1 3/5/3 7/6/5
f 7//1 8//2 9//3
f ...
...
# Line element (see below)
l 5 8 1 2 4 9
"""

VERTEX_FORMAT: str = "<fffbbbxee"

class vertex:
	def __init__(self, position, normal, uv) -> None:
		self.position = position
		self.normal = normal
		self.uv = uv

	def binary(self) -> bytes:
		return struct.pack(VERTEX_FORMAT, *self.position, *self.normal, *self.uv)

	def size(self) -> int:
		return struct.calcsize(VERTEX_FORMAT)


class mesh:
	def __init__(self, vertices, indices) -> None:
		self.vertices = vertices
		self.indices = indices

	def binary(self) -> tuple[bytes, bytes]:
		return (
			b''.join([vert.binary() for vert in self.vertices]),
			b''.join([struct.pack("<H", index) for index in self.indices])
		)

class model:
	pass



def read_obj_file(file_path):
	vertices = []
	faces = []

	# Open the .obj file
	with open(file_path, 'r') as obj_file:
		for line in obj_file:
			# Split the line into components
			parts = line.split()

			# Parse vertex positions
			if parts[0] == 'v':  # Vertex
				x, y, z = map(float, parts[1:4])
				vertices.append((x, y, z))

			# Parse faces
			elif parts[0] == 'f':  # Face
				# OBJ files use 1-based indexing, so subtract 1 for 0-based Python indexing
				face = [int(i.split('/')[0]) - 1 for i in parts[1:]]
				faces.append(face)

	return vertices, faces

def write_binary_file(output_file_path, vertices, faces):
	with open(output_file_path, 'wb') as binary_file:
		# Writing vertices to the binary file
		for vertex in vertices:
			# Packing the vertex (x, y, z) into a binary format (float = 'f')
			binary_data = struct.pack('fff', *vertex)
			binary_file.write(binary_data)

		# Writing faces to the binary file
		for face in faces:
			# Assume each face is a triangle with 3 vertices
			# Packing the face indices (int = 'I' for unsigned int)
			binary_data = struct.pack('III', *face)
			binary_file.write(binary_data)

def dump(m: mesh) -> None:
	

if __name__ == '__main__':
	vert: vertex = vertex([1.0, 0.0, 1.0], [0, 127, 0], [1.0, 0.5])
	binary: bytes = vert.binary()
	with open('test.gmb', 'wb') as binary_file:
		binary_file.write(binary)

	# obj_file_path = 'path_to_your_file.obj'
	# output_binary_file_path = 'output_binary_file.bin'

	# # Step 1: Read .obj file
	# vertices, faces = read_obj_file(obj_file_path)

	# # Step 2: Write data into a binary file
	# write_binary_file(output_binary_file_path, vertices, faces)
