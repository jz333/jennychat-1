require 'rack'


# normal HTTP request
# static file server set up

# Rack::Handler::Thin.run(Rack::Builder.new {
#   use(Rack::Static, urls: ["/"], root: "public")
#   run ->env{[200, {}, [some_dyamically_generated_content]]}
# }, Port: 4568)


app = Rack::Builder.new {
  use(Rack::Static, urls: ["/"], root: "public")
  run ->env{[200, {}, [some_dyamically_generated_content]]}
}

# def app.call(env)
#   handle_http_request(env['REQUEST_METHOD'], env['PATH_INFO'], env['rack.input'], env)
# end

Rack::Handler::Thin.run(app, Port: 4568)



# def handle_http_request(method, path, data, env)
#     if method == "GET"
#       # [200, {}, [some_dyamically_generated_content]]
#       [200,
#       {"Content-Type" => "text/html",
#       'Access-Control-Allow-Origin': '*',
#       'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
#       'Access-Control-Allow-Headers': 'Origin, Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, body, Authorization'},
#       ["You have requested the path #{path}, using GET"]]

#     elsif method == "OPTIONS"
#       #puts path
#       [200,
#       { "Content-Type" => "text/html",
#       'Access-Control-Allow-Origin': '*',
#       'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
#       'Access-Control-Allow-Headers': 'Origin, Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, body, Authorization'},
#       ['Access Allowed.']]
#     elsif method == "POST"
#       # puts method
#       # puts data


#       req = Rack::Request.new(env)
#       # puts req.params

#       req.params.keys.each { |file|
#         filedata = req.params[file]
#         filename = filedata[:filename]
#         filepath = filedata[:tempfile].path

#         File.open("public/images/#{filename}", 'w+') do |f|
#           f.write File.read(filepath)
#         end
#       }

#       [200,
#       { "Content-Type" => "text/html",
#       'Access-Control-Allow-Origin': '*',
#       'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
#       'Access-Control-Allow-Headers': 'Origin, Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, body, Authorization'},
#       ['Receiving.']]

#     end
#   end
